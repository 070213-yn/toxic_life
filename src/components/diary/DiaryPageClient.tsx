'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { notifyDiscord } from '@/lib/discord'
import type { DiaryEntry } from '@/lib/types'

// ========================================
// ヘルパー関数
// ========================================

// 日付文字列から月・日を取得
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

// ========================================
// 複数写真をCanvasでコラージュして1枚のJPEGにする
// ========================================
async function createCollage(files: File[]): Promise<Blob> {
  // 全画像を読み込む
  const images = await Promise.all(
    files.map(
      (f) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => reject(new Error('画像の読み込みに失敗'))
          img.src = URL.createObjectURL(f)
        })
    )
  )

  const canvas = document.createElement('canvas')
  const maxWidth = 1200 // 出力最大幅
  const ctx = canvas.getContext('2d')!

  if (images.length === 1) {
    // 1枚: リサイズのみ
    const ratio = Math.min(maxWidth / images[0].width, 1)
    canvas.width = images[0].width * ratio
    canvas.height = images[0].height * ratio
    ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height)
  } else if (images.length === 2) {
    // 2枚横並び
    const halfW = maxWidth / 2
    const maxH = Math.max(
      ...images.map((img) => (halfW / img.width) * img.height)
    )
    canvas.width = maxWidth
    canvas.height = maxH
    images.forEach((img, i) => {
      const h = (halfW / img.width) * img.height
      ctx.drawImage(img, i * halfW, 0, halfW, h)
    })
  } else if (images.length === 3) {
    // 上1枚大 + 下2枚小
    const topH = (maxWidth / images[0].width) * images[0].height
    const halfW = maxWidth / 2
    const bottomH = Math.max(
      (halfW / images[1].width) * images[1].height,
      (halfW / images[2].width) * images[2].height
    )
    canvas.width = maxWidth
    canvas.height = topH + bottomH
    ctx.drawImage(images[0], 0, 0, maxWidth, topH)
    ctx.drawImage(images[1], 0, topH, halfW, bottomH)
    ctx.drawImage(images[2], halfW, topH, halfW, bottomH)
  } else {
    // 4枚以上: 2列グリッド
    const cols = 2
    const cellW = maxWidth / cols
    const rows = Math.ceil(images.length / cols)
    const cellH = cellW * 0.75 // 4:3比
    canvas.width = maxWidth
    canvas.height = cellH * rows
    // 背景を白で塗りつぶし（隙間対策）
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    images.forEach((img, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH)
    })
  }

  // ObjectURLを解放
  images.forEach((img) => URL.revokeObjectURL(img.src))

  // JPEG圧縮（品質80%）
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8)
  })
}

// ========================================
// コラージュプレビューをURLとして生成
// ========================================
async function createCollagePreview(files: File[]): Promise<string> {
  const blob = await createCollage(files)
  return URL.createObjectURL(blob)
}

// ========================================
// メインコンポーネント
// ========================================
type Props = {
  entries: DiaryEntry[]
}

export default function DiaryPageClient({ entries: initialEntries }: Props) {
  const { user, profile } = useAuth()
  const [entries, setEntries] = useState<DiaryEntry[]>(initialEntries)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 既存エントリを編集モードにする
  const startEdit = useCallback((entryId: string) => {
    setEditingId(entryId)
  }, [])

  // 編集モードを終了
  const cancelEdit = useCallback(() => {
    setEditingId(null)
  }, [])

  // 新規エントリ保存後のコールバック
  const handleNewEntrySaved = useCallback((newEntry: DiaryEntry) => {
    setEntries((prev) =>
      [newEntry, ...prev].sort((a, b) =>
        b.entry_date.localeCompare(a.entry_date)
      )
    )
  }, [])

  // 既存エントリ更新後のコールバック
  const handleEntryUpdated = useCallback((updated: DiaryEntry) => {
    setEntries((prev) =>
      prev
        .map((e) => (e.id === updated.id ? updated : e))
        .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
    )
    setEditingId(null)
  }, [])

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

    setEntries((prev) => prev.filter((e) => e.id !== entryId))
    setDeletingId(null)
  }, [])

  return (
    <div className="px-4 pb-28 md:pb-8">
      {/* 新規入力カード（常にページ上部に表示） */}
      <div className="max-w-2xl mx-auto mb-8">
        <DiaryCardEditable
          mode="create"
          userId={user?.id ?? null}
          displayName={profile?.display_name ?? null}
          onSaved={handleNewEntrySaved}
        />
      </div>

      {/* 日記一覧 */}
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-sub text-sm">
            まだ日記がありません。上のカードから最初の日記を書いてみよう
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {entries.map((entry) =>
            editingId === entry.id ? (
              <DiaryCardEditable
                key={entry.id}
                mode="edit"
                entry={entry}
                userId={user?.id ?? null}
                displayName={
                  entry.profiles?.display_name ?? profile?.display_name ?? null
                }
                onSaved={handleEntryUpdated}
                onCancel={cancelEdit}
              />
            ) : (
              <DiaryCardView
                key={entry.id}
                entry={entry}
                currentUserId={user?.id ?? null}
                onEdit={() => startEdit(entry.id)}
                onDelete={() => handleDelete(entry.id)}
                isDeleting={deletingId === entry.id}
              />
            )
          )}
        </div>
      )}
    </div>
  )
}

// ========================================
// 閲覧モードの絵日記カード
// ========================================
function DiaryCardView({
  entry,
  currentUserId,
  onEdit,
  onDelete,
  isDeleting,
}: {
  entry: DiaryEntry
  currentUserId: string | null
  onEdit: () => void
  onDelete: () => void
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
          <div
            className="border-b-2 border-gray-800 relative"
            style={{ aspectRatio: '16/10' }}
          >
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

            {/* 自分の日記なら編集・削除ボタン */}
            {isOwner && (
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                <button
                  onClick={onEdit}
                  className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                  title="編集"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4A4458"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
                <button
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="削除"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* テキストエリア（縦書き表示） */}
          <div
            className="p-3 font-[family-name:var(--font-zen-maru)] overflow-x-auto"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              minHeight: '200px',
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent, transparent calc(1.5em - 1px), #ddd calc(1.5em - 1px), #ddd 1.5em)',
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
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-dm-sans)]">
              {month}
            </span>
            <span className="text-xs text-gray-600 font-[family-name:var(--font-zen-maru)]">
              がつ
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 mt-2">
            <span className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-dm-sans)]">
              {day}
            </span>
            <span className="text-xs text-gray-600 font-[family-name:var(--font-zen-maru)]">
              にち
            </span>
          </div>
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
// 編集可能な絵日記カード（新規作成・既存編集の両方に対応）
// ========================================
function DiaryCardEditable({
  mode,
  entry,
  userId,
  displayName,
  onSaved,
  onCancel,
}: {
  mode: 'create' | 'edit'
  entry?: DiaryEntry
  userId: string | null
  displayName: string | null
  onSaved: (entry: DiaryEntry) => void
  onCancel?: () => void
}) {
  const { profile } = useAuth()
  const [formDate, setFormDate] = useState(
    entry?.entry_date ?? getTodayStr()
  )
  const [formContent, setFormContent] = useState(entry?.content ?? '')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [collagePreview, setCollagePreview] = useState<string | null>(
    // 編集モードで既存写真がある場合はそのURLをプレビューに
    entry?.photo_path ? getPhotoUrl(entry.photo_path) : null
  )
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 日付から月・日を取得（右サイドバー表示用）
  const { month, day } = parseDateParts(formDate || getTodayStr())

  // 写真選択ハンドラー（複数対応）
  const handlePhotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return

      const fileArray = Array.from(files)
      setSelectedFiles(fileArray)

      // コラージュプレビューを生成
      try {
        const previewUrl = await createCollagePreview(fileArray)
        // 古いプレビューURLがあれば解放（既存写真URLは解放しない）
        if (collagePreview && !entry?.photo_path) {
          URL.revokeObjectURL(collagePreview)
        }
        setCollagePreview(previewUrl)
      } catch {
        alert('写真の読み込みに失敗しました')
      }

      // inputをリセット（同じファイルを再選択できるように）
      e.target.value = ''
    },
    [collagePreview, entry?.photo_path]
  )

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!userId || !formContent.trim()) return
    setIsSaving(true)

    try {
      let photoPath: string | null = entry?.photo_path ?? null

      // 新しい写真がある場合はコラージュしてアップロード
      if (selectedFiles.length > 0) {
        const collageBlob = await createCollage(selectedFiles)
        const entryId = entry?.id ?? crypto.randomUUID()
        const filePath = `diary/${entryId}/${Date.now()}.jpg`

        const { error: uploadError } = await supabase.storage
          .from('scouting-photos')
          .upload(filePath, collageBlob, {
            upsert: true,
            contentType: 'image/jpeg',
          })

        if (uploadError) {
          alert('写真のアップロードに失敗しました: ' + uploadError.message)
          setIsSaving(false)
          return
        }
        photoPath = filePath
      }

      if (mode === 'edit' && entry) {
        // 更新
        const { data, error } = await supabase
          .from('diary_entries')
          .update({
            content: formContent.trim(),
            entry_date: formDate,
            photo_path: photoPath,
          })
          .eq('id', entry.id)
          .select('*, profiles(display_name, avatar_emoji)')
          .single()

        if (error) {
          alert('更新に失敗しました: ' + error.message)
          setIsSaving(false)
          return
        }

        onSaved(data as DiaryEntry)
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from('diary_entries')
          .insert({
            user_id: userId,
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

        onSaved(data as DiaryEntry)

        // フォームをリセット
        setFormDate(getTodayStr())
        setFormContent('')
        setSelectedFiles([])
        if (collagePreview) {
          URL.revokeObjectURL(collagePreview)
        }
        setCollagePreview(null)

        // Discord通知
        const name = profile?.display_name ?? 'だれか'
        notifyDiscord(
          `📝 ${name}が日記を書きました！\n[日記を見る →](https://toxiclife.vercel.app/diary)`
        )
      }
    } catch {
      alert('エラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }, [
    userId,
    formContent,
    formDate,
    selectedFiles,
    entry,
    mode,
    onSaved,
    collagePreview,
    profile,
  ])

  return (
    <div
      className="diary-card bg-white border-2 border-gray-800 overflow-hidden"
      style={{ animation: 'fade-slide-up 0.3s ease-out' }}
    >
      <div className="flex">
        {/* メインコンテンツ */}
        <div className="flex-1 min-w-0">
          {/* 写真エリア（クリックで写真選択） */}
          <div
            className="border-b-2 border-gray-800 relative cursor-pointer group"
            style={{ aspectRatio: '16/10' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {collagePreview ? (
              <>
                <img
                  src={collagePreview}
                  alt="コラージュプレビュー"
                  className="w-full h-full object-cover"
                />
                {/* 写真変更のオーバーレイ */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 px-3 py-1.5 rounded-lg">
                    写真を変更
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:text-primary/60 group-hover:bg-primary-light/20 transition-colors">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-sm">+ 写真を選択（複数可）</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* テキスト入力エリア（横書きで入力） */}
          <div className="p-3">
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="きょうのできごとを書こう..."
              rows={6}
              className="w-full px-2 py-1.5 text-sm text-gray-800 bg-transparent border-none resize-none focus:outline-none font-[family-name:var(--font-zen-maru)] leading-relaxed"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(180deg, transparent, transparent calc(1.8em - 1px), #e5e5e5 calc(1.8em - 1px), #e5e5e5 1.8em)',
                backgroundPosition: '0 0.4em',
              }}
            />
          </div>

          {/* 保存ボタン */}
          <div className="px-3 pb-3 flex gap-2">
            {mode === 'edit' && onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-text-sub hover:bg-gray-50 transition-colors font-[family-name:var(--font-zen-maru)]"
              >
                キャンセル
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !formContent.trim()}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 font-[family-name:var(--font-zen-maru)]"
            >
              {isSaving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>

        {/* 右サイドバー（日付・名前） */}
        <div
          className="w-14 border-l-2 border-gray-800 flex flex-col items-center py-3 gap-1 shrink-0 bg-white"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          {/* 日付入力 */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-dm-sans)]">
              {month}
            </span>
            <span className="text-xs text-gray-600 font-[family-name:var(--font-zen-maru)]">
              がつ
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 mt-2">
            <span className="text-2xl font-bold text-gray-800 font-[family-name:var(--font-dm-sans)]">
              {day}
            </span>
            <span className="text-xs text-gray-600 font-[family-name:var(--font-zen-maru)]">
              にち
            </span>
          </div>

          {/* 小さなdate input（日付変更用） */}
          <div className="mt-1 flex items-center justify-center" style={{ writingMode: 'horizontal-tb' }}>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-10 h-6 text-[9px] text-center text-gray-500 bg-gray-50 border border-gray-200 rounded cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
              title="日付を変更"
            />
          </div>

          {/* 名前 */}
          <div className="mt-auto flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-gray-500 font-[family-name:var(--font-zen-maru)]">
              なまえ
            </span>
            <span className="text-xs text-gray-700 font-[family-name:var(--font-zen-maru)] font-medium">
              {displayName ?? '---'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
