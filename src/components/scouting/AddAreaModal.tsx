'use client'

// エリア追加モーダル
// 新しい下見エリアを登録する（写真アップロード、アクセス情報入力対応）

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

type Props = {
  onClose: () => void
}

type AccessEntry = {
  station: string
  time: string
}

export default function AddAreaModal({ onClose }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // フォーム状態
  const [name, setName] = useState('')
  const [nearestStation, setNearestStation] = useState('')
  const [visitedDate, setVisitedDate] = useState(
    new Date().toISOString().split('T')[0] // デフォルト: 今日
  )
  const [rentMemo, setRentMemo] = useState('')
  const [accessEntries, setAccessEntries] = useState<AccessEntry[]>([
    { station: '渋谷', time: '' },
    { station: '新宿', time: '' },
    { station: '池袋', time: '' },
  ])
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 写真選択ハンドラ
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setPhotos((prev) => [...prev, ...files])

    // プレビュー生成
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPhotoPreviews((prev) => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  // 写真削除
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // アクセス情報の更新
  const updateAccess = (index: number, field: keyof AccessEntry, value: string) => {
    setAccessEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    )
  }

  // アクセス情報の追加
  const addAccessEntry = () => {
    setAccessEntries((prev) => [...prev, { station: '', time: '' }])
  }

  // アクセス情報の削除
  const removeAccessEntry = (index: number) => {
    setAccessEntries((prev) => prev.filter((_, i) => i !== index))
  }

  // 保存処理
  const handleSave = async () => {
    if (!name.trim()) {
      setError('エリア名を入力してください')
      return
    }

    setSaving(true)
    setError('')

    try {
      // access_info をオブジェクトに変換（空の値は除外）
      const accessInfo: Record<string, string> = {}
      accessEntries.forEach((entry) => {
        if (entry.station.trim() && entry.time.trim()) {
          accessInfo[entry.station.trim()] = entry.time.trim()
        }
      })

      // エリアをINSERT
      const { data: area, error: insertError } = await supabase
        .from('scouting_areas')
        .insert({
          name: name.trim(),
          nearest_station: nearestStation.trim() || null,
          visited_date: visitedDate || null,
          access_info: Object.keys(accessInfo).length > 0 ? accessInfo : null,
          rent_memo: rentMemo.trim() || null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 写真をアップロード
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}_${i}.${ext}`
        const storagePath = `areas/${area.id}/${fileName}`

        // Storageにアップロード
        const { error: uploadError } = await supabase.storage
          .from('scouting-photos')
          .upload(storagePath, file)

        if (uploadError) {
          console.error('写真アップロードエラー:', uploadError)
          continue
        }

        // scouting_photos テーブルにINSERT
        await supabase.from('scouting_photos').insert({
          area_id: area.id,
          storage_path: storagePath,
          sort_order: i,
        })
      }

      // ページをリフレッシュしてモーダルを閉じる
      router.refresh()
      onClose()
    } catch (err) {
      console.error('保存エラー:', err)
      setError('保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* モーダル本体 */}
      <div className="relative bg-bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl animate-slide-up">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-bg-card/95 backdrop-blur-sm border-b border-primary-light/30 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-text">エリアを追加</h2>
          <button
            onClick={onClose}
            className="text-text-sub hover:text-text transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* エリア名 */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              エリア名 <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 中目黒エリア"
              className="w-full border border-primary-light/40 rounded-xl px-4 py-2.5 text-sm text-text bg-bg placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 最寄り駅 */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">最寄り駅</label>
            <input
              type="text"
              value={nearestStation}
              onChange={(e) => setNearestStation(e.target.value)}
              placeholder="例: 中目黒駅"
              className="w-full border border-primary-light/40 rounded-xl px-4 py-2.5 text-sm text-text bg-bg placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 訪問日 */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">訪問日</label>
            <input
              type="date"
              value={visitedDate}
              onChange={(e) => setVisitedDate(e.target.value)}
              className="w-full border border-primary-light/40 rounded-xl px-4 py-2.5 text-sm text-text bg-bg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 写真アップロード */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">写真</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-primary-light/50 rounded-xl py-4 text-sm text-text-sub hover:border-primary/40 hover:bg-primary-light/10 transition-colors"
            >
              写真を選択（複数可）
            </button>

            {/* プレビュー */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {photoPreviews.map((preview, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={preview}
                      alt={`プレビュー ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-black/70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* アクセス情報 */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              主要駅へのアクセス時間
            </label>
            <div className="space-y-2">
              {accessEntries.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={entry.station}
                    onChange={(e) => updateAccess(i, 'station', e.target.value)}
                    placeholder="駅名"
                    className="flex-1 border border-primary-light/40 rounded-xl px-3 py-2 text-sm text-text bg-bg placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    value={entry.time}
                    onChange={(e) => updateAccess(i, 'time', e.target.value)}
                    placeholder="例: 15分"
                    className="w-24 border border-primary-light/40 rounded-xl px-3 py-2 text-sm text-text bg-bg placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => removeAccessEntry(i)}
                    className="text-text-sub/40 hover:text-accent transition-colors p-1 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addAccessEntry}
              className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              + 駅を追加
            </button>
          </div>

          {/* 家賃相場メモ */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              2LDK家賃相場メモ
            </label>
            <textarea
              value={rentMemo}
              onChange={(e) => setRentMemo(e.target.value)}
              placeholder="例: 2LDK 15〜20万円程度、築浅だと25万前後"
              rows={3}
              className="w-full border border-primary-light/40 rounded-xl px-4 py-2.5 text-sm text-text bg-bg placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* エラー表示 */}
          {error && (
            <p className="text-sm text-accent">{error}</p>
          )}

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white font-medium py-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
