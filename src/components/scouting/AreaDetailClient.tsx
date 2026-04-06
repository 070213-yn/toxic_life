'use client'

// エリア詳細クライアントコンポーネント
// 写真ギャラリー、評価、コメント、エリア情報、削除の5セクション構成
// 「ふたりで作り上げるかわいいエリアメモページ」

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import { findRentData } from '@/lib/rent-data'
import type { ScoutingArea, ScoutingPhoto } from '@/lib/types'
import RatingSection from './RatingSection'
import CommentSection from './CommentSection'

// リアルタイム監視対象テーブル（エリア詳細ページ用）
const REALTIME_TABLES = ['scouting_photos', 'scouting_ratings', 'scouting_comments', 'scouting_areas']

type Props = {
  area: ScoutingArea
}

// Supabase StorageのパブリックURLを取得
function getPhotoUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scouting-photos/${path}`
}

// 保存成功フィードバック用フック
function useSaveToast() {
  const [visible, setVisible] = useState(false)
  const show = useCallback(() => {
    setVisible(true)
    setTimeout(() => setVisible(false), 2000)
  }, [])
  return { visible, show }
}

export default function AreaDetailClient({ area }: Props) {
  useRealtimeRefresh(REALTIME_TABLES)
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveToast = useSaveToast()

  const photos = area.scouting_photos || []
  const ratings = area.scouting_ratings || []
  const comments = area.scouting_comments || []

  // 写真ギャラリー関連
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // キャプション編集
  const [editingCaption, setEditingCaption] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState('')

  // インライン編集状態
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState(area.name)
  const [editStation, setEditStation] = useState(area.nearest_station || '')
  const [editDate, setEditDate] = useState(area.visited_date || '')
  const [editRentMemo, setEditRentMemo] = useState(area.rent_memo || '')
  const [editPropertyNotes, setEditPropertyNotes] = useState(area.property_notes || '')

  // アクセス情報
  const [accessInfo, setAccessInfo] = useState<Record<string, string>>(
    (area.access_info as Record<string, string>) || {}
  )
  const [newAccessStation, setNewAccessStation] = useState('')
  const [newAccessTime, setNewAccessTime] = useState('')

  // 削除確認
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  // 訪問日フォーマット
  const visitedLabel = area.visited_date
    ? new Date(area.visited_date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '未訪問'

  // エリア基本情報を更新
  const saveField = async (field: string, value: unknown) => {
    setSaving(true)
    const { error } = await supabase
      .from('scouting_areas')
      .update({ [field]: value })
      .eq('id', area.id)

    if (!error) {
      setEditing(null)
      saveToast.show()
      router.refresh()
    }
    setSaving(false)
  }

  // 写真アップロード
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !user) return

    setUploadingPhoto(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${i}.${ext}`
      const storagePath = `areas/${area.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('scouting-photos')
        .upload(storagePath, file)

      if (uploadError) {
        console.error('写真アップロードエラー:', uploadError)
        continue
      }

      await supabase.from('scouting_photos').insert({
        area_id: area.id,
        storage_path: storagePath,
        sort_order: photos.length + i,
      })
    }

    setUploadingPhoto(false)
    // ファイル入力をリセット
    if (fileInputRef.current) fileInputRef.current.value = ''
    router.refresh()
  }

  // 写真削除
  const handlePhotoDelete = async (photo: ScoutingPhoto) => {
    await supabase.storage.from('scouting-photos').remove([photo.storage_path])
    await supabase.from('scouting_photos').delete().eq('id', photo.id)
    setSelectedPhotoIndex(null)
    router.refresh()
  }

  // キャプション保存
  const handleCaptionSave = async (photoId: string) => {
    const { error } = await supabase
      .from('scouting_photos')
      .update({ caption: captionDraft.trim() || null })
      .eq('id', photoId)

    if (!error) {
      setEditingCaption(null)
      saveToast.show()
      router.refresh()
    }
  }

  // アクセス情報の追加
  const addAccessEntry = async () => {
    if (!newAccessStation.trim() || !newAccessTime.trim()) return
    const updated = { ...accessInfo, [newAccessStation.trim()]: newAccessTime.trim() }
    setAccessInfo(updated)
    setNewAccessStation('')
    setNewAccessTime('')
    await saveField('access_info', updated)
  }

  // アクセス情報の削除
  const removeAccessEntry = async (station: string) => {
    const updated = { ...accessInfo }
    delete updated[station]
    setAccessInfo(updated)
    await saveField('access_info', Object.keys(updated).length > 0 ? updated : null)
  }

  // エリア削除
  const handleDelete = async () => {
    setDeleting(true)

    // Storage内の写真を削除
    if (photos.length > 0) {
      const paths = photos.map((p) => p.storage_path)
      await supabase.storage.from('scouting-photos').remove(paths)
    }

    // 関連データを削除
    await supabase.from('scouting_photos').delete().eq('area_id', area.id)
    await supabase.from('scouting_ratings').delete().eq('area_id', area.id)
    await supabase.from('scouting_comments').delete().eq('area_id', area.id)
    await supabase.from('scouting_areas').delete().eq('id', area.id)

    router.push('/scouting')
    router.refresh()
  }

  // モーダル内で左右矢印キーで写真を移動
  useEffect(() => {
    if (selectedPhotoIndex === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : prev
        )
      } else if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((prev) =>
          prev !== null && prev < photos.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'Escape') {
        setSelectedPhotoIndex(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedPhotoIndex, photos.length])

  // 現在選択中の写真
  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null

  return (
    <div className="min-h-screen bg-bg pb-24 md:pb-8">
      {/* 保存成功トースト */}
      {saveToast.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-[fade-slide-up_0.3s_ease-out]">
          <div className="flex items-center gap-2 bg-success/90 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            保存しました
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="px-4 pt-6 max-w-5xl mx-auto">
        <Link
          href="/scouting"
          className="inline-flex items-center gap-1.5 text-sm text-text-sub hover:text-primary transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          一覧に戻る
        </Link>

        {/* エリア名（インライン編集対応） */}
        <div className="group">
          {editing === 'name' ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveField('name', editName.trim())
                  if (e.key === 'Escape') { setEditing(null); setEditName(area.name) }
                }}
                className="text-xl font-bold text-text bg-bg border border-primary-light/40 rounded-xl px-3 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <button
                onClick={() => saveField('name', editName.trim())}
                disabled={saving}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                保存
              </button>
              <button
                onClick={() => { setEditing(null); setEditName(area.name) }}
                className="text-sm text-text-sub"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1
                className="text-xl font-bold text-text cursor-pointer hover:text-primary/80 transition-colors"
                onClick={() => setEditing('name')}
                title="クリックで編集"
              >
                {area.name}
              </h1>
              {/* ホバーで鉛筆アイコン */}
              <button
                onClick={() => setEditing('name')}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-sub/40 hover:text-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* マップ連携ボタン */}
        <div className="mt-3 flex items-center gap-3">
          {area.latitude == null || area.longitude == null ? (
            // 緯度経度が未設定 → ピン配置モードへ遷移
            <Link
              href={`/map?pin_area_id=${area.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm rounded-full hover:bg-primary/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              マップにピンを追加
            </Link>
          ) : (
            // 緯度経度が設定済み → マップでフォーカス表示
            <Link
              href={`/map?focus_area_id=${area.id}`}
              className="inline-flex items-center gap-1 text-sm text-text-sub hover:text-primary transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              マップで見る
            </Link>
          )}
        </div>

        {/* 最寄り駅・訪問日 */}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-sub">
          {editing === 'station' ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editStation}
                onChange={(e) => setEditStation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveField('nearest_station', editStation.trim() || null)
                  if (e.key === 'Escape') { setEditing(null); setEditStation(area.nearest_station || '') }
                }}
                placeholder="駅名を入力"
                className="text-sm text-text bg-bg border border-primary-light/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <button
                onClick={() => saveField('nearest_station', editStation.trim() || null)}
                disabled={saving}
                className="text-xs text-primary font-medium"
              >
                保存
              </button>
              <button
                onClick={() => { setEditing(null); setEditStation(area.nearest_station || '') }}
                className="text-xs text-text-sub"
              >
                取消
              </button>
            </div>
          ) : (
            <span
              className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setEditing('station')}
              title="クリックで編集"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {area.nearest_station || '駅名を入力'}
            </span>
          )}

          <span className="text-text-sub/30">|</span>

          {editing === 'date' ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="text-sm text-text bg-bg border border-primary-light/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <button
                onClick={() => saveField('visited_date', editDate || null)}
                disabled={saving}
                className="text-xs text-primary font-medium"
              >
                保存
              </button>
              <button
                onClick={() => { setEditing(null); setEditDate(area.visited_date || '') }}
                className="text-xs text-text-sub"
              >
                取消
              </button>
            </div>
          ) : (
            <span
              className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
              onClick={() => setEditing('date')}
              title="クリックで編集"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {visitedLabel}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 max-w-5xl mx-auto mt-6 space-y-6">

        {/* ===== セクション1: 写真ギャラリー ===== */}
        <section
          className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-4"
          style={{ animation: 'fade-slide-up 0.4s ease-out both' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-text">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              写真ギャラリー
              {photos.length > 0 && (
                <span className="text-xs text-text-sub font-normal">({photos.length}枚)</span>
              )}
            </h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-1 text-xs text-white bg-primary hover:bg-primary/80 font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    アップロード中...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    写真を追加
                  </>
                )}
              </button>
            </div>
          </div>

          {photos.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center py-10 text-text-sub/50 hover:text-primary/60 hover:bg-primary-light/10 rounded-xl transition-all cursor-pointer"
            >
              <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm font-medium">まだ写真がないよ</p>
              <p className="text-xs mt-1">下見した時の写真を追加してね！</p>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group/photo animate-[fade-slide-up_0.3s_ease-out_both]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* 写真サムネイル */}
                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                    onClick={() => setSelectedPhotoIndex(index)}
                  >
                    <Image
                      src={getPhotoUrl(photo.storage_path)}
                      alt={photo.caption || 'エリア写真'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 300px"
                    />
                    {/* 削除ボタン（ホバー時） */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('この写真を削除しますか？')) handlePhotoDelete(photo)
                      }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white/80 hover:bg-accent/80 hover:text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* キャプション表示・編集 */}
                  <div className="mt-1.5 px-0.5">
                    {editingCaption === photo.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={captionDraft}
                          onChange={(e) => setCaptionDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCaptionSave(photo.id)
                            if (e.key === 'Escape') setEditingCaption(null)
                          }}
                          placeholder="キャプションを入力..."
                          className="flex-1 text-xs text-text bg-bg border border-primary-light/40 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                          autoFocus
                        />
                        <button
                          onClick={() => handleCaptionSave(photo.id)}
                          className="text-xs text-primary font-medium shrink-0"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <p
                        className="text-xs text-text-sub truncate cursor-pointer hover:text-primary transition-colors"
                        onClick={() => {
                          setEditingCaption(photo.id)
                          setCaptionDraft(photo.caption || '')
                        }}
                        title="クリックでキャプション編集"
                      >
                        {photo.caption || (
                          <span className="text-text-sub/30 italic">キャプションを追加...</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== セクション2: ふたりの評価 ===== */}
        <div style={{ animation: 'fade-slide-up 0.4s ease-out 0.1s both' }}>
          <RatingSection areaId={area.id} ratings={ratings} />
        </div>

        {/* ===== セクション3: ふたりの感想 ===== */}
        <div style={{ animation: 'fade-slide-up 0.4s ease-out 0.15s both' }}>
          <CommentSection
            areaId={area.id}
            comments={comments as Parameters<typeof CommentSection>[0]['comments']}
          />
        </div>

        {/* ===== セクション4: エリア情報 ===== */}
        <section
          className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-4 space-y-5"
          style={{ animation: 'fade-slide-up 0.4s ease-out 0.2s both' }}
        >
          <h2 className="flex items-center gap-2 text-sm font-bold text-text">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            エリア情報
          </h2>

          {/* アクセス情報 */}
          <div>
            <h3 className="text-xs font-medium text-text-sub mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              アクセス情報
            </h3>

            {Object.keys(accessInfo).length === 0 ? (
              <p className="text-xs text-text-sub/40 py-1">まだ登録されていません</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {Object.entries(accessInfo).map(([station, time]) => (
                  <div key={station} className="flex items-center justify-between bg-primary-light/15 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text font-medium">{station}</span>
                      <span className="text-xs text-text-sub bg-bg rounded-full px-2 py-0.5">{time}</span>
                    </div>
                    <button
                      onClick={() => removeAccessEntry(station)}
                      className="text-text-sub/30 hover:text-accent transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* アクセス情報追加フォーム */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAccessStation}
                onChange={(e) => setNewAccessStation(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addAccessEntry() }}
                placeholder="駅名（例: 渋谷）"
                className="flex-1 border border-primary-light/40 rounded-lg px-3 py-1.5 text-sm text-text bg-bg placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="text"
                value={newAccessTime}
                onChange={(e) => setNewAccessTime(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addAccessEntry() }}
                placeholder="例: 20分"
                className="w-24 border border-primary-light/40 rounded-lg px-3 py-1.5 text-sm text-text bg-bg placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={addAccessEntry}
                className="text-xs text-white bg-primary/80 hover:bg-primary font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                追加
              </button>
            </div>
          </div>

          {/* 家賃相場メモ */}
          <div>
            <h3 className="text-xs font-medium text-text-sub mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              2LDK家賃相場メモ
            </h3>
            {editing === 'rent' ? (
              <div>
                <textarea
                  value={editRentMemo}
                  onChange={(e) => setEditRentMemo(e.target.value)}
                  rows={3}
                  className="w-full border border-primary-light/40 rounded-xl px-3 py-2 text-sm text-text bg-bg placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="例: 2LDK 15~20万円程度"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => { setEditing(null); setEditRentMemo(area.rent_memo || '') }}
                    className="text-xs text-text-sub"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => saveField('rent_memo', editRentMemo.trim() || null)}
                    disabled={saving}
                    className="text-xs text-primary font-medium"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer hover:bg-primary-light/10 rounded-lg px-3 py-2 transition-colors"
                onClick={() => setEditing('rent')}
                title="クリックで編集"
              >
                {area.rent_memo ? (
                  <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{area.rent_memo}</p>
                ) : (() => {
                  // 家賃メモが空の場合、駅名から相場を参考表示
                  const rentRef = findRentData(area.nearest_station || '')
                  return rentRef ? (
                    <div>
                      <p className="text-xs text-text-sub/40 italic mb-1.5">クリックして入力...</p>
                      <p className="text-xs text-primary/80 bg-primary-light/20 rounded-lg px-2.5 py-1.5">
                        参考: {rentRef.station}駅の2LDK相場は約{rentRef.data.rent}です
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-text-sub/40 italic">クリックして入力...</p>
                  )
                })()}
              </div>
            )}
          </div>

          {/* 気になる物件メモ */}
          <div>
            <h3 className="text-xs font-medium text-text-sub mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              気になる物件メモ
            </h3>
            {editing === 'property' ? (
              <div>
                <textarea
                  value={editPropertyNotes}
                  onChange={(e) => setEditPropertyNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-primary-light/40 rounded-xl px-3 py-2 text-sm text-text bg-bg placeholder:text-text-sub/40 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="気になった物件情報をメモ..."
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => { setEditing(null); setEditPropertyNotes(area.property_notes || '') }}
                    className="text-xs text-text-sub"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => saveField('property_notes', editPropertyNotes.trim() || null)}
                    disabled={saving}
                    className="text-xs text-primary font-medium"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer hover:bg-primary-light/10 rounded-lg px-3 py-2 transition-colors"
                onClick={() => setEditing('property')}
                title="クリックで編集"
              >
                {area.property_notes ? (
                  <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{area.property_notes}</p>
                ) : (
                  <p className="text-xs text-text-sub/40 italic">クリックして入力...</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ===== セクション5: 危険ゾーン ===== */}
        <section
          className="pt-2 pb-4"
          style={{ animation: 'fade-slide-up 0.4s ease-out 0.25s both' }}
        >
          {showDeleteConfirm ? (
            <div className="bg-accent/10 border border-accent/30 rounded-2xl p-5 text-center animate-[fade-slide-up_0.2s_ease-out]">
              <svg className="w-10 h-10 text-accent/60 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-text font-medium mb-2">
                「{area.name}」を削除しますか？
              </p>
              <p className="text-xs text-text-sub mb-4">
                写真・評価・コメントもすべて削除されます。この操作は取り消せません。
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-sm text-text-sub px-5 py-2 rounded-lg hover:bg-bg transition-colors"
                >
                  やめる
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm text-white bg-accent px-5 py-2 rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {deleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-sm text-accent/50 hover:text-accent py-3 transition-colors rounded-lg hover:bg-accent/5"
            >
              このエリアを削除
            </button>
          )}
        </section>
      </div>

      {/* ===== 写真拡大モーダル ===== */}
      {selectedPhoto && selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* 閉じるボタン */}
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 左矢印 */}
          {selectedPhotoIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedPhotoIndex(selectedPhotoIndex - 1)
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* 右矢印 */}
          {selectedPhotoIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedPhotoIndex(selectedPhotoIndex + 1)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* 写真本体 */}
          <div
            className="relative w-full max-w-3xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[75vh] rounded-xl overflow-hidden">
              <Image
                src={getPhotoUrl(selectedPhoto.storage_path)}
                alt={selectedPhoto.caption || 'エリア写真'}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>

            {/* キャプションとページ番号 */}
            <div className="mt-3 text-center space-y-1">
              {selectedPhoto.caption && (
                <p className="text-white/80 text-sm">{selectedPhoto.caption}</p>
              )}
              <p className="text-white/40 text-xs">
                {selectedPhotoIndex + 1} / {photos.length}
              </p>
            </div>

            {/* 削除ボタン */}
            <button
              onClick={() => {
                if (confirm('この写真を削除しますか？')) handlePhotoDelete(selectedPhoto)
              }}
              className="absolute bottom-16 right-2 flex items-center gap-1 text-xs text-white/50 hover:text-accent bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-full transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
