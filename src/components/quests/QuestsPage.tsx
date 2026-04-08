'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Milestone, Profile } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
import { notifyDiscord } from '@/lib/discord'
import { MilestoneCard } from './MilestoneCard'

// リアルタイム監視対象テーブル（クエストページ用）

type Props = {
  milestones: Milestone[]
  totalSavings: number
  profiles: Profile[]
}

// クエストページ全体のクライアントコンポーネント
// 上部にサマリー、下にマイルストーンカード一覧を表示
export default function QuestsPage({ milestones, totalSavings, profiles }: Props) {
  const router = useRouter()

  // 完了/未完了の分類
  const { completed, incomplete, totalCount, completedCount, nextMilestone } = useMemo(() => {
    const comp = milestones.filter((m) => m.is_completed)
    const incomp = milestones.filter((m) => !m.is_completed)

    // 次の期限があるマイルストーンを探す
    const next = incomp.find((m) => m.deadline) ?? incomp[0] ?? null

    return {
      completed: comp,
      incomplete: incomp,
      totalCount: milestones.length,
      completedCount: comp.length,
      nextMilestone: next,
    }
  }, [milestones])

  // 全体の進捗率
  const overallProgress = totalCount > 0 ? completedCount / totalCount : 0

  // 次のマイルストーンまでの残り日数を計算
  const daysUntilNext = useMemo(() => {
    if (!nextMilestone?.deadline) return null
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const deadline = new Date(nextMilestone.deadline)
    deadline.setHours(0, 0, 0, 0)
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [nextMilestone])

  // 既存マイルストーンの最大sort_orderを算出
  const maxSortOrder = useMemo(() => {
    if (milestones.length === 0) return 0
    return Math.max(...milestones.map((m) => m.sort_order))
  }, [milestones])

  return (
    <div className="px-2 pb-28 max-w-5xl mx-auto sm:px-6">
      {/* --- 全体の進捗サマリー --- */}
      <div className="mb-6 p-3 sm:p-5 rounded-2xl bg-bg-card border border-primary-light/40 shadow-sm">
        {/* クリア数表示 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-text">
            {completedCount}/{totalCount} クリア
          </span>
          <span className="text-xs text-text-sub">
            {Math.round(overallProgress * 100)}%
          </span>
        </div>

        {/* プログレスバー（グラデーション） */}
        <div className="h-3 bg-primary-light/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${overallProgress * 100}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              animation: 'bar-fill 1s ease-out',
            }}
          />
        </div>

        {/* 次の目標表示 */}
        {nextMilestone && (
          <p className="mt-3 text-xs text-text-sub">
            次の目標:{' '}
            <span className="font-medium text-text">{nextMilestone.title}</span>
            {daysUntilNext !== null && (
              <span className={`ml-1 ${daysUntilNext < 7 ? 'text-accent font-medium' : ''}`}>
                （あと{daysUntilNext}日）
              </span>
            )}
          </p>
        )}
      </div>

      {/* --- マイルストーンカード一覧 --- */}
      {milestones.length === 0 ? (
        <div className="text-center py-16 text-text-sub">
          <p className="text-4xl mb-4">
            {/* 巻物のアイコン（絵文字を使用） */}
          </p>
          <p>まだクエストがありません</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* 未完了マイルストーン（上に表示） */}
          {incomplete.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              totalSavings={totalSavings}
              defaultExpanded={true}
              profiles={profiles}
            />
          ))}

          {/* 完了済みマイルストーン（下に表示、薄く） */}
          {completed.length > 0 && (
            <div className="pt-4 space-y-4">
              <p className="text-xs font-medium text-text-sub/60 uppercase tracking-wider">
                -- クリア済み --
              </p>
              {completed.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  totalSavings={totalSavings}
                  defaultExpanded={false}
                  profiles={profiles}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- チャプター追加ボタン --- */}
      <AddChapterSection
        maxSortOrder={maxSortOrder}
        onAdded={() => router.refresh()}
      />
    </div>
  )
}

// チャプター（マイルストーン）追加セクション
function AddChapterSection({
  maxSortOrder,
  onAdded,
}: {
  maxSortOrder: number
  onAdded: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [savingsGoal, setSavingsGoal] = useState('')
  const [reward, setReward] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // フォームを開く
  const openForm = useCallback(() => {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // フォームを閉じてリセット
  const closeForm = useCallback(() => {
    setIsOpen(false)
    setTitle('')
    setDeadline('')
    setSavingsGoal('')
    setReward('')
  }, [])

  // チャプターを追加
  const handleAdd = useCallback(async () => {
    if (!title.trim() || saving) return
    setSaving(true)

    try {
      const { error } = await supabase.from('milestones').insert({
        title: title.trim(),
        deadline: deadline || null,
        savings_goal: savingsGoal ? Number(savingsGoal) : null,
        reward: reward.trim() || null,
        sort_order: maxSortOrder + 1,
        is_completed: false,
      })

      if (error) throw error

      // Discord通知（fire and forget）
      notifyDiscord(`📋 新しいクエスト「${title.trim()}」が追加されました！`)

      closeForm()
      onAdded()
    } catch (e) {
      alert('追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }, [title, deadline, savingsGoal, reward, maxSortOrder, saving, closeForm, onAdded])

  if (!isOpen) {
    return (
      <div className="mt-8 flex justify-center">
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-5 py-2.5 text-sm text-text-sub/60 hover:text-primary border border-dashed border-text-sub/20 hover:border-primary/40 rounded-2xl transition-all duration-200 hover:bg-primary/5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          チャプターを追加
        </button>
      </div>
    )
  }

  return (
    <div
      className="mt-8 p-5 rounded-2xl border border-primary-light/30 bg-bg-card shadow-sm space-y-3"
      style={{ animation: 'fade-slide-up 0.3s ease-out' }}
    >
      <h4 className="text-sm font-bold text-text mb-1">新しいチャプター</h4>

      {/* タイトル */}
      <div>
        <label className="block text-xs font-medium text-text-sub mb-1">タイトル *</label>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 家具・家電をそろえる"
          maxLength={100}
          className="w-full px-3 py-2 text-sm rounded-xl border border-primary/20 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-text-sub/40"
        />
      </div>

      {/* 期限 */}
      <div>
        <label className="block text-xs font-medium text-text-sub mb-1">期限</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-xl border border-primary/20 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      {/* 貯金目標額 */}
      <div>
        <label className="block text-xs font-medium text-text-sub mb-1">貯金目標額（任意）</label>
        <input
          type="number"
          value={savingsGoal}
          onChange={(e) => setSavingsGoal(e.target.value)}
          placeholder="例: 500000"
          min={0}
          className="w-full px-3 py-2 text-sm rounded-xl border border-primary/20 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-text-sub/40"
        />
      </div>

      {/* ご褒美 */}
      <div>
        <label className="block text-xs font-medium text-text-sub mb-1">ご褒美（任意）</label>
        <input
          type="text"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          placeholder="例: 2人でちょっといいディナー"
          maxLength={100}
          className="w-full px-3 py-2 text-sm rounded-xl border border-primary/20 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-text-sub/40"
        />
      </div>

      {/* ボタン */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleAdd}
          disabled={saving || !title.trim()}
          className="px-5 py-2 text-xs font-medium text-white bg-primary rounded-xl hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '追加中...' : '追加する'}
        </button>
        <button
          onClick={closeForm}
          disabled={saving}
          className="px-4 py-2 text-xs font-medium text-text-sub bg-text-sub/10 rounded-xl hover:bg-text-sub/20 disabled:opacity-50 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
