'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { notifyDiscord } from '@/lib/discord'
import type { Reward } from '@/lib/types'

type Props = {
  milestoneId: string
  existingReward?: Reward | null  // 編集時に既存データを渡す
  defaultSecret?: boolean         // 「秘密のご褒美を追加」から開いた時はtrue
  onClose: () => void
  onSaved: (reward: Reward) => void
}

// ご褒美作成・編集モーダル
export function RewardModal({ milestoneId, existingReward, defaultSecret = false, onClose, onSaved }: Props) {
  const router = useRouter()
  const { user, profile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(existingReward?.title ?? '')
  const [message, setMessage] = useState(existingReward?.message ?? '')
  const [url, setUrl] = useState(existingReward?.url ?? '')
  const [plannedDate, setPlannedDate] = useState(existingReward?.planned_date ?? '')
  const [isSecret, setIsSecret] = useState(existingReward?.is_secret ?? defaultSecret)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isEditing = !!existingReward

  // 既存画像のプレビュー
  useEffect(() => {
    if (existingReward?.image_path) {
      const { data } = supabase.storage.from('scouting-photos').getPublicUrl(existingReward.image_path)
      setImagePreview(data.publicUrl)
    }
  }, [existingReward?.image_path])

  // 画像選択
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    // プレビュー生成
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  // 画像を削除
  const removeImage = useCallback(() => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!title.trim() || !user || saving) return
    setSaving(true)

    try {
      let imagePath = existingReward?.image_path ?? null

      if (isEditing && existingReward) {
        // --- 更新 ---
        // 新しい画像がある場合はアップロード
        if (imageFile) {
          const ext = imageFile.name.split('.').pop()
          const path = `rewards/${existingReward.id}/${Date.now()}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('scouting-photos')
            .upload(path, imageFile, { upsert: true })
          if (!uploadError) imagePath = path
        } else if (!imagePreview) {
          // 画像が削除された
          imagePath = null
        }

        const { data, error } = await supabase
          .from('rewards')
          .update({
            title: title.trim(),
            message: message.trim() || null,
            url: url.trim() || null,
            planned_date: plannedDate || null,
            is_secret: isSecret,
            image_path: imagePath,
          })
          .eq('id', existingReward.id)
          .select('*, profiles:created_by(display_name, avatar_emoji)')
          .single()

        if (error) throw error

        // Discord通知（更新）
        if (isSecret) {
          notifyDiscord(`🎁 秘密のご褒美が更新されました！`)
        } else {
          notifyDiscord(`🎁 ご褒美の内容が更新されました！\n[ご褒美を見る →](https://toxiclife.vercel.app/rewards/${existingReward.id})`)
        }

        onSaved(data as Reward)
      } else {
        // --- 新規作成 ---
        const { data: newReward, error: insertError } = await supabase
          .from('rewards')
          .insert({
            milestone_id: milestoneId,
            created_by: user.id,
            title: title.trim(),
            message: message.trim() || null,
            url: url.trim() || null,
            planned_date: plannedDate || null,
            is_secret: isSecret,
            is_revealed: false,
          })
          .select('*, profiles:created_by(display_name, avatar_emoji)')
          .single()

        if (insertError) throw insertError

        // 画像アップロード（IDが確定してから）
        if (imageFile && newReward) {
          const ext = imageFile.name.split('.').pop()
          const path = `rewards/${newReward.id}/${Date.now()}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('scouting-photos')
            .upload(path, imageFile, { upsert: true })
          if (!uploadError) {
            // image_pathを更新
            await supabase
              .from('rewards')
              .update({ image_path: path })
              .eq('id', newReward.id)
            newReward.image_path = path
          }
        }

        // Discord通知（新規作成）
        if (isSecret) {
          const creatorName = profile?.display_name ?? 'だれか'
          notifyDiscord(`🎁 秘密のご褒美が追加されました！\n${creatorName}からのサプライズです`)
        } else if (newReward) {
          notifyDiscord(`🎁 ご褒美の内容が更新されました！\n[ご褒美を見る →](https://toxiclife.vercel.app/rewards/${newReward.id})`)
        }

        if (newReward) onSaved(newReward as Reward)
      }

      router.refresh()
      onClose()
    } catch (err) {
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }, [title, message, url, plannedDate, isSecret, imageFile, imagePreview, user, saving, existingReward, isEditing, milestoneId, profile, router, onClose, onSaved])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div
        className="relative w-full max-w-md mx-2 sm:mx-4 bg-bg-card rounded-t-3xl sm:rounded-3xl border border-primary-light/30 shadow-xl max-h-[85vh] overflow-y-auto"
        style={{ animation: 'fade-slide-up 0.3s ease-out' }}
      >
        <div className="p-5 space-y-4">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-text">
              {isEditing ? 'ご褒美を編集' : isSecret || defaultSecret ? '🔮 秘密のご褒美' : '🎁 ご褒美を追加'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-sub/50 hover:text-text hover:bg-text-sub/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* タイトル（必須） */}
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1">タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 2人でちょっといいディナー"
              maxLength={100}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-primary/20 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-text-sub/40"
            />
          </div>

          {/* メッセージ（任意） */}
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1">お祝いメッセージ</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="おめでとう！一緒に頑張ったね"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-primary/20 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-text-sub/40 resize-none"
            />
          </div>

          {/* 画像アップロード（任意） */}
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1">画像</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-primary/10">
                <img src={imagePreview} alt="プレビュー" className="w-full h-40 object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border-2 border-dashed border-primary/20 rounded-xl text-text-sub/50 hover:text-primary hover:border-primary/40 transition-colors flex flex-col items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <span className="text-xs">画像を追加</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* URL（任意） */}
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1">URL（外部リンク）</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-primary/20 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-text-sub/40"
            />
          </div>

          {/* 予定日（任意） */}
          <div>
            <label className="block text-xs font-medium text-text-sub mb-1">予定日</label>
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-primary/20 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* 秘密にするチェックボックス */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200/50 cursor-pointer hover:bg-purple-100/50 transition-colors">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
              className="w-4 h-4 rounded border-purple-300 text-purple-500 focus:ring-purple-400 accent-purple-500"
            />
            <div>
              <span className="text-sm font-medium text-text">🔮 秘密にする</span>
              <p className="text-xs text-text-sub/60 mt-0.5">
                チャプタークリアまで相手には見えません
              </p>
            </div>
          </label>

          {/* ボタン */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '保存中...' : isEditing ? '更新する' : '保存する'}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-text-sub bg-text-sub/10 rounded-xl hover:bg-text-sub/20 disabled:opacity-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
