'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { notifyDiscord } from '@/lib/discord'
import type { DiaryEntry } from '@/lib/types'

// 日付文字列から月・日を取得するヘルパー
function parseDateParts(dateStr: string): { month: number; day: number } {
  const d = new Date(dateStr + 'T00:00:00')
  return { month: d.getMonth() + 1, day: d.getDate() }
}

// Supabase Storageの公開URLを取得
function getPhotoUrl(path: string): string {
  const { data } = supabase.storage.from('scouting-photos').getPublicUrl(path)
  return data.publicUrl
}

// 今日の日付をYYYY-MM-DD形式で取得
function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

type Props = {
  entries: DiaryEntry[]
}

export default function DiaryPageClient({ entries: initialEntries }: Props) {
  const { user, profile } = useAuth()
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries)

  // モーダル状態
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null)

  // フォーム状態
  const [formDate, setFormDate] = useState(getTodayStr())
  const [formContent, setFormContent] = useState('')
  const [formPhoto, setFormPhoto] = useState<File | null>(null)
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // モーダルを開く（新規作成）
  const openCreateModal = useCallback(() => {
    setEditingEntry(null)
    setFormDate(getTodayStr())
    setFormContent('')
    setFormPhoto(null)
    setFormPhotoPreview(null)
    setShowModal(true)
  }, [])

  // モーダルを開く（編集）
  const openEditModal = useCallback((entry: DiaryEntry) => {
    setEditingEntry(entry)
    setFormDate(entry.entry_date)
    setFormContent(entry.content)
    setFormPhoto(null)
    setFormPhotoPreview(entry.photo_path ? getPhotoUrl(entry.photo_path) : null)
    setShowModal(true)
  }, [])

  // モーダルを閉じる
  const closeModal = useCallback(() => {
    setShowModal(false)
    setEditingEntry(null)
    setFormPhoto(null)
    setFormPhotoPreview(null)
  }, [])

  // 写真選択ハンドラー
  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFormPhoto(file)
    // プレビュー用URLを生成
    const url = URL.createObjectURL(file)
    setFormPhotoPreview(url)
  }, [])

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!user || !formContent.trim()) return
    setIsSaving(true)

    try {
      let photoPath: string | null = editingEntry?.photo_path ?? null

      // 新しい写真がある場合はアップロード
      if (formPhoto) {
        const entryId = editingEntry?.id ?? crypto.randomUUID()
        const ext = formPhoto.name.split('.').pop()
        const filePath = `diary/${entryId}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('scouting-photos')
          .upload(filePath, formPhoto, { upsert: true })

        if (uploadError) {
          alert('写真のアップロードに失敗しました: ' + uploadError.message)
          setIsSaving(false)
          return
        }
        photoPath = filePath
      }

      if (editingEntry) {
        // 更新
        const { data, error } = await supabase
          .from('diary_entries')
          .update({
            content: formContent.trim(),
            entry_date: formDate,
            photo_path: photoPath,
          })
          .eq('id', editingEntry.id)
          .select('*, profiles(display_name, avatar_emoji)')
          .single()

        if (error) {
          alert('更新に失敗しました: ' + error.message)
          setIsSaving(false)
          return
        }

        // ローカル状態を更新
        setEntries(prev =>
          prev.map(e => e.id === editingEntry.id ? (data as DiaryEntry) : e)
            .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
        )
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from('diary_entries')
          .insert({
            user_id: user.id,
            content: formContent.trim(),
            entry_date: formDate,
            photo_path: photoPath,
          })
          .select('*, profiles(display_name, avatar_emoji)')
          .single()

        if (error) {
          alert('保存に失敗しました: ' + error.message)
          setIsSaving(false)
          return
        }

        // ローカル状態に追加
        setEntries(prev =>
          [data as DiaryEntry, ...prev].sort((a, b) => b.entry_date.localeCompare(a.entry_date))
        )

        // Discord通知
        const name = profile?.display_name ?? 'だれか'
        notifyDiscord(`📝 ${name}が日記を書きました！\n[日記を見る →](https://toxiclife.vercel.app/diary)`)
      }

      closeModal()
    } catch {
      alert('エラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }, [user, profile, formContent, formDate, formPhoto, editingEntry, closeModal])

  // 削除処理
  const handleDelete = useCallback(async (entryId: string) => {
    if (!confirm('この日記を削除しますか？')) return
    setDeletingId(entryId)

    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', entryId)

    if (error) {
      alert('削除に失敗しました: ' + error.message)
      setDeletingId(null)
      return
    }

    setEntries(prev => prev.filter(e => e.id !== entryId))
    setDeletingId(null)
  }, [])

  return (
    <div className="px-4 pb-28 md:pb-8">
      {/* 日記を書くボタン */}
      <div className="text-center mb-6">
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm shadow-sm hover:opacity-90 transition-opacity"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
          </svg>
          日記を書く
        </button>
      </div>

      {/* 日記一覧 */}
      {entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📒</p>
          <p className="text-text-sub text-sm">まだ日記がありません</p>
          <p className="text-text-sub/60 text-xs mt-1">「日記を書く」ボタンから最初の日記を書いてみよう</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {entries.map(entry => (
            <DiaryCard
              key={entry.id}
              entry={entry}
              currentUserId={user?.id ?? null}
              onEdit={openEditModal}
              onDelete={handleDelete}
              isDeleting={deletingId === entry.id}
            />
          ))}
        </div>
      )}

      {/* 作成・編集モーダル */}
      {showModal && (
        <DiaryModal
          isEditing={!!editingEntry}
          formDate={formDate}
          formContent={formContent}
          formPhotoPreview={formPhotoPreview}
          isSaving={isSaving}
          fileInputRef={fileInputRef}
          onDateChange={setFormDate}
          onContentChange={setFormContent}
          onPhotoChange={handlePhotoChange}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

// ========================================
// 絵日記カードコンポーネント
// ========================================
function DiaryCard({
  entry,
  currentUserId,
  onEdit,
  onDelete,
  isDeleting,
}: {
  entry: DiaryEntry
  currentUserId: string | null
  onEdit: (entry: DiaryEntry) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const { month, day } = parseDateParts(entry.entry_date)
  const isOwner = currentUserId === entry.user_id
  const displayName = entry.profiles?.display_name ?? '???'

  return (
    <div
      className="diary-card bg-white border-2 border-gray-800 overflow-hidden"
      style={{ animation: 'fade-slide-up 0.3s ease-out' }}
    >
      <div className="flex">
        {/* メインコンテンツ（写真＋テキスト） */}
        <div className="flex-1 min-w-0">
          {/* 写真エリア */}
          <div className="border-b-2 border-gray-800 relative" style={{ aspectRatio: '16/10' }}>
            {entry.photo_path ? (
              <img
                src={getPhotoUrl(entry.photo_path)}
                alt="日記の写真"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-sm">写真なし</span>
              </div>
            )}

            {/* 自分の日記なら編集・削除ボタン（写真エリア右上） */}
            {isOwner && (
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                <button
                  onClick={() => onEdit(entry)}
                  className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                  title="編集"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A4458" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  disabled={isDeleting}
                  className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="削除"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* テキストエリア（縦書き） */}
          <div
            className="p-3 font-[family-name:var(--font-zen-maru)] overflow-x-auto"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              minHeight: '200px',
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent calc(1.5em - 1px), #ddd calc(1.5em - 1px), #ddd 1.5em)',
            }}
          >
            <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>
        </div>

        {/* 右サイドバー（日付・名前） */}
        <div
          className="w-12 border-l-2 border-gray-800 flex flex-col items-center py-3 gap-1 shrink-0 bg-white"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          {/* 月 */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-dm-sans)]">
              {month}
            </span>
            <span className="text-xs text-gray-600 font-[family-name:var(--font-zen-maru)]">
              がつ
            </span>
          </div>

          {/* 日 */}
          <div className="flex flex-col items-center gap-0.5 mt-2">
            <span className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-dm-sans)]">
              {day}
            </span>
            <span className="text-xs text-gray-600 font-[family-name:var(--font-zen-maru)]">
              にち
            </span>
          </div>

          {/* 名前 */}
          <div className="mt-auto flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-gray-500 font-[family-name:var(--font-zen-maru)]">
              なまえ
            </span>
            <span className="text-xs text-gray-700 font-[family-name:var(--font-zen-maru)] font-medium">
              {displayName}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ========================================
// 日記作成・編集モーダル
// ========================================
function DiaryModal({
  isEditing,
  formDate,
  formContent,
  formPhotoPreview,
  isSaving,
  fileInputRef,
  onDateChange,
  onContentChange,
  onPhotoChange,
  onSave,
  onClose,
}: {
  isEditing: boolean
  formDate: string
  formContent: string
  formPhotoPreview: string | null
  isSaving: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onDateChange: (v: string) => void
  onContentChange: (v: string) => void
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* モーダル本体 */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text font-[family-name:var(--font-zen-maru)]">
              {isEditing ? '日記を編集' : '日記を書く'}
            </h2>
            <button onClick={onClose} className="p-1.5 text-text-sub hover:text-text transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 日付 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text mb-1">日付</label>
            <input
              type="date"
              value={formDate}
              onChange={e => onDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* 写真 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text mb-1">写真</label>
            {formPhotoPreview ? (
              <div className="relative">
                <img
                  src={formPhotoPreview}
                  alt="プレビュー"
                  className="w-full aspect-video object-cover rounded-xl border border-gray-200"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-xs text-text hover:bg-white transition-colors"
                >
                  変更
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary/50 hover:text-primary/60 transition-colors"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-sm">写真を追加</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              className="hidden"
            />
          </div>

          {/* 内容 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-text mb-1">内容</label>
            <textarea
              value={formContent}
              onChange={e => onContentChange(e.target.value)}
              placeholder="きょうのできごと..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white text-text resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 font-[family-name:var(--font-zen-maru)]"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-text-sub hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || !formContent.trim()}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
