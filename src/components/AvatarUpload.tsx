'use client'

import { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { supabase } from '@/lib/supabase/client'

type Props = {
  userId: string
  currentAvatar: string | null
  onComplete: () => void
  onCancel: () => void
}

// 画像をcanvasでクロップしてBlobを返す
async function getCroppedImg(imageSrc: string, cropArea: Area): Promise<Blob> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  await new Promise<void>((resolve) => {
    image.onload = () => resolve()
    image.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const size = 256 // 出力サイズ
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    size,
    size
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
  })
}

export default function AvatarUpload({ userId, currentAvatar, onComplete, onCancel }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ファイル選択時
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  // アップロード＆保存
  const handleSave = async () => {
    if (!imageSrc || !croppedArea) return
    setUploading(true)

    try {
      const blob = await getCroppedImg(imageSrc, croppedArea)
      const fileName = `avatars/${userId}.jpg`

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('scouting-photos')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('scouting-photos')
        .getPublicUrl(fileName)

      // プロフィールに保存（avatar_emojiカラムにURLを入れる）
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_emoji: urlData.publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      onComplete()
    } catch {
      alert('アップロードに失敗しました。もう一度試してね')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-bg-card rounded-2xl shadow-xl w-80 overflow-hidden">
        <div className="px-4 py-3 border-b border-primary-light/30">
          <p className="text-sm font-medium text-text">プロフィール画像</p>
        </div>

        {/* 現在のアバター or クロップエリア */}
        <div className="p-4">
          {imageSrc ? (
            <>
              {/* クロッパー */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              {/* ズームスライダー */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-text-sub">小</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-xs text-text-sub">大</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {/* 現在のアバター表示 */}
              <div className="w-24 h-24 rounded-xl bg-primary-light/30 flex items-center justify-center overflow-hidden">
                {currentAvatar && (currentAvatar.startsWith('http') || currentAvatar.startsWith('/')) ? (
                  <img src={currentAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{currentAvatar || '😊'}</span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-primary-light/50 text-primary text-sm font-medium hover:bg-primary-light/70 transition-colors"
              >
                画像を選択
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* ボタン */}
        <div className="px-4 py-3 border-t border-primary-light/30 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs text-text-sub hover:bg-bg transition-colors"
          >
            キャンセル
          </button>
          {imageSrc && (
            <button
              onClick={handleSave}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg text-xs bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
