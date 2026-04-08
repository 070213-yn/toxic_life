'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Milestone, Profile, Task, Reward } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
import { TaskList } from './TaskList'
import { AddTaskModal } from './AddTaskModal'
import { ConfettiEffect } from './ConfettiEffect'
import { notifyDiscord } from '@/lib/discord'
import { RewardModal } from '@/components/rewards/RewardModal'
import Link from 'next/link'

type Props = {
  milestone: Milestone
  totalSavings: number
  defaultExpanded: boolean // 初期展開状態
  profiles: Profile[] // 担当者のアバター表示用
  rewards?: Reward[] // このマイルストーンのご褒美一覧
}

// マイルストーンカード
// 未完了は常に展開、完了済みは折りたたみ可能
export function MilestoneCard({ milestone, totalSavings, defaultExpanded, profiles, rewards: initialRewards = [] }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [tasks, setTasks] = useState<Task[]>(milestone.tasks ?? [])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // ご褒美関連
  const [rewardsList, setRewardsList] = useState<Reward[]>(initialRewards)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardModalSecret, setRewardModalSecret] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)

  // 編集モード関連
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editTitle, setEditTitle] = useState(milestone.title)
  const [editDeadline, setEditDeadline] = useState(milestone.deadline ?? '')
  const [editReward, setEditReward] = useState(milestone.reward ?? '')

  // 現在の表示用の値
  const [currentTitle, setCurrentTitle] = useState(milestone.title)
  const [currentDeadline, setCurrentDeadline] = useState(milestone.deadline)
  const [currentReward, setCurrentReward] = useState(milestone.reward)

  // タスクの完了数・全数
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.is_completed).length
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0

  // ステータス判定
  const isCompleted = milestone.is_completed || (totalTasks > 0 && completedTasks === totalTasks)

  // 期限のフォーマット（例: 〜2026年5月末）
  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    return `〜${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  // 編集モードを開始
  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTitle(currentTitle)
    setEditDeadline(currentDeadline ?? '')
    setEditReward(currentReward ?? '')
    setIsEditing(true)
  }, [currentTitle, currentDeadline, currentReward])

  // 編集をキャンセル
  const cancelEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(false)
  }, [])

  // 編集を保存
  const saveEditing = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSaving(true)

    const { error } = await supabase
      .from('milestones')
      .update({
        title: editTitle.trim(),
        deadline: editDeadline || null,
        reward: editReward.trim() || null,
      })
      .eq('id', milestone.id)

    setIsSaving(false)

    if (error) {
      alert('保存に失敗しました: ' + error.message)
      return
    }

    setCurrentTitle(editTitle.trim())
    setCurrentDeadline(editDeadline || null)
    setCurrentReward(editReward.trim() || null)
    setIsEditing(false)
    router.refresh()
  }, [editTitle, editDeadline, editReward, milestone.id, router])

  // タスク更新コールバック
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
  }, [])

  // タスク削除コールバック
  const handleTaskDelete = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  // タスク追加コールバック + Discord通知
  const handleTaskAdd = useCallback((newTask: Task) => {
    setTasks((prev) => [...prev, newTask])
    notifyDiscord(`📝 新しいタスク「${newTask.title}」が追加されました！（${newTask.assignee}）\n[タスクを見る →](https://toxiclife.vercel.app/quests)`)
  }, [])

  // マイルストーン達成時の紙吹雪 + Discord通知 + 秘密のご褒美を公開
  const handleMilestoneComplete = useCallback(async () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)

    // Discord通知（fire and forget）
    const subtitle = milestone.subtitle ? `${milestone.subtitle} ` : ''
    notifyDiscord(`🎉 ${subtitle}「${milestone.title}」をクリアしました！おめでとう！\n[タスクを見る →](https://toxiclife.vercel.app/quests)`)

    // 秘密のご褒美を公開する
    const secretRewards = rewardsList.filter((r) => r.is_secret && !r.is_revealed)
    if (secretRewards.length > 0) {
      for (const reward of secretRewards) {
        await supabase
          .from('rewards')
          .update({ is_revealed: true, revealed_at: new Date().toISOString() })
          .eq('id', reward.id)

        notifyDiscord(`🎁✨ 秘密のご褒美が見れるようになりました！\n[開封する →](https://toxiclife.vercel.app/rewards/${reward.id})`)
      }
      // ローカル状態も更新
      setRewardsList((prev) =>
        prev.map((r) =>
          r.is_secret && !r.is_revealed
            ? { ...r, is_revealed: true, revealed_at: new Date().toISOString() }
            : r
        )
      )
    }
  }, [milestone.subtitle, milestone.title, rewardsList])

  // カードのスタイル（完了時は薄く）
  const cardStyle = isCompleted
    ? 'opacity-70 border-success/20 bg-success/5'
    : 'border-primary-light/40 bg-bg-card hover:-translate-y-0.5 hover:shadow-md'

  return (
    <>
      {showConfetti && <ConfettiEffect />}

      <div
        className={`rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${cardStyle}`}
        style={{
          animation: 'fade-slide-up 0.4s ease-out both',
        }}
      >
        {/* --- ヘッダー --- */}
        {isEditing ? (
          // 編集モード
          <div className="p-3 sm:p-5" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">タイトル</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">期限</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">ご褒美</label>
                <input
                  type="text"
                  value={editReward}
                  onChange={(e) => setEditReward(e.target.value)}
                  placeholder="例: 2人でちょっといいランチ"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={saveEditing}
                  disabled={isSaving || !editTitle.trim()}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-medium text-text-sub bg-text-sub/10 rounded-lg hover:bg-text-sub/20 disabled:opacity-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        ) : (
          // 通常表示
          <div className="p-3 sm:p-5">
            {/* ヘッダー行: タイトル + 期限 + 編集ボタン */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* サブタイトル（MS1 など） */}
                  {milestone.subtitle && (
                    <span className="text-xs font-bold text-primary bg-primary-light/40 px-2 py-0.5 rounded-full">
                      {milestone.subtitle}
                    </span>
                  )}
                  <h3 className="font-bold text-text text-base leading-snug">
                    {currentTitle}
                  </h3>
                </div>
                {/* 期限 */}
                {currentDeadline && (
                  <p className="text-xs text-text-sub mt-1">
                    {formatDeadline(currentDeadline)}
                  </p>
                )}
              </div>

              {/* 編集ボタン + 折りたたみボタン（完了済みのみ） */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={startEditing}
                  className="p-1.5 rounded-lg text-text-sub/50 hover:text-primary hover:bg-primary/10 transition-colors"
                  title="編集"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
                {isCompleted && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="p-1.5 rounded-lg text-text-sub/50 hover:text-primary hover:bg-primary/10 transition-colors"
                    title={expanded ? '折りたたむ' : '展開する'}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* プログレスバー */}
            {totalTasks > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-text-sub mb-1.5">
                  <span>{completedTasks}/{totalTasks} 完了</span>
                  <span className="font-medium">{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-2.5 bg-primary-light/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${progress * 100}%`,
                      background: isCompleted
                        ? 'var(--success)'
                        : 'linear-gradient(90deg, var(--primary), var(--accent))',
                      animation: 'bar-fill 0.8s ease-out',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 展開コンテンツ --- */}
        {(expanded || defaultExpanded) && !isEditing && (
          <div className="px-3 pb-3 sm:px-5 sm:pb-5 border-t border-text-sub/5">
            {/* 貯金目標プログレス */}
            {milestone.savings_goal !== null && milestone.savings_goal > 0 && (
              <SavingsProgress
                totalSavings={totalSavings}
                savingsGoal={milestone.savings_goal}
              />
            )}

            {/* タスクリスト（担当者別グループ） */}
            <TaskList
              tasks={tasks}
              totalSavings={totalSavings}
              savingsGoal={milestone.savings_goal}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onAllTasksComplete={handleMilestoneComplete}
              profiles={profiles}
            />

            {/* インライン目標追加 */}
            <InlineAddTask
              milestoneId={milestone.id}
              onAdd={handleTaskAdd}
              showAddModal={() => setShowAddModal(true)}
            />

            {/* ご褒美表示 */}
            {currentReward && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-accent-warm/15 border border-accent-warm/20">
                <p className="text-sm text-text">
                  <span className="mr-1.5">🎁</span>
                  <span className="text-xs text-text-sub mr-1">ご褒美:</span>
                  <span className="font-medium">{currentReward}</span>
                </p>
              </div>
            )}

            {/* ご褒美詳細一覧 + 管理ボタン */}
            <div className="mt-3 space-y-2">
              {/* 登録済みご褒美一覧 */}
              {rewardsList.map((reward) => (
                <div
                  key={reward.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                    reward.is_secret
                      ? 'bg-purple-50/50 border-purple-200/40'
                      : 'bg-pink-50/50 border-pink-200/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span>{reward.is_secret ? '🔮' : '🎁'}</span>
                    <span className="text-sm text-text truncate">{reward.title}</span>
                    {reward.is_secret && !reward.is_revealed && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-500 font-medium">秘密</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        setEditingReward(reward)
                        setRewardModalSecret(reward.is_secret)
                        setShowRewardModal(true)
                      }}
                      className="p-1 rounded-lg text-text-sub/40 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="編集"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                    <Link
                      href={`/rewards/${reward.id}`}
                      className="p-1 rounded-lg text-text-sub/40 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="詳細を見る"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}

              {/* ご褒美追加ボタン */}
              <div className="flex items-center gap-2 pt-1">
                {rewardsList.length === 0 && (
                  <button
                    onClick={() => {
                      setEditingReward(null)
                      setRewardModalSecret(false)
                      setShowRewardModal(true)
                    }}
                    className="flex items-center gap-1 text-xs text-text-sub/50 hover:text-primary transition-colors py-1"
                  >
                    <span>🎁</span>
                    ご褒美詳細を作成
                  </button>
                )}
                {rewardsList.length > 0 && (
                  <button
                    onClick={() => {
                      setEditingReward(null)
                      setRewardModalSecret(false)
                      setShowRewardModal(true)
                    }}
                    className="flex items-center gap-1 text-xs text-text-sub/50 hover:text-primary transition-colors py-1"
                  >
                    <span>🎁</span>
                    ご褒美を追加
                  </button>
                )}
                <span className="text-text-sub/20">|</span>
                <button
                  onClick={() => {
                    setEditingReward(null)
                    setRewardModalSecret(true)
                    setShowRewardModal(true)
                  }}
                  className="flex items-center gap-1 text-xs text-purple-400/60 hover:text-purple-500 transition-colors py-1"
                >
                  <span>🔮</span>
                  秘密のご褒美を追加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* タスク追加モーダル */}
      {showAddModal && (
        <AddTaskModal
          milestoneId={milestone.id}
          onClose={() => setShowAddModal(false)}
          onAdd={handleTaskAdd}
        />
      )}

      {/* ご褒美作成・編集モーダル */}
      {showRewardModal && (
        <RewardModal
          milestoneId={milestone.id}
          existingReward={editingReward}
          defaultSecret={rewardModalSecret}
          onClose={() => {
            setShowRewardModal(false)
            setEditingReward(null)
          }}
          onSaved={(savedReward) => {
            if (editingReward) {
              // 更新
              setRewardsList((prev) =>
                prev.map((r) => (r.id === savedReward.id ? savedReward : r))
              )
            } else {
              // 新規追加
              setRewardsList((prev) => [...prev, savedReward])
            }
          }}
        />
      )}
    </>
  )
}

// 貯金目標プログレス表示
function SavingsProgress({
  totalSavings,
  savingsGoal,
}: {
  totalSavings: number
  savingsGoal: number
}) {
  const achieved = totalSavings >= savingsGoal
  const progress = Math.min(totalSavings / savingsGoal, 1)
  const percentage = Math.round(progress * 100)

  const formatYen = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

  return (
    <div className="mt-4 mb-2 p-3 rounded-xl bg-success/5 border border-success/15">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
            <path d="M2 9v1c0 1.1.9 2 2 2h1" />
            <path d="M16 11h.01" />
          </svg>
          <span className="text-xs font-medium text-success">
            貯金 {formatYen(savingsGoal)} {achieved ? '達成!' : '目標'}
          </span>
        </div>
        <span className="text-xs text-text-sub">
          {formatYen(totalSavings)} / {formatYen(savingsGoal)}
        </span>
      </div>

      <div className="h-2.5 bg-success/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            achieved
              ? 'bg-gradient-to-r from-success to-success/70'
              : 'bg-gradient-to-r from-success/60 to-success/40'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {achieved ? (
        <p className="text-xs text-success mt-1.5 text-center font-medium">目標達成おめでとう!</p>
      ) : (
        <p className="text-xs text-text-sub mt-1 text-right">あと {formatYen(savingsGoal - totalSavings)}</p>
      )}
    </div>
  )
}

// インライン目標追加コンポーネント
function InlineAddTask({
  milestoneId,
  onAdd,
  showAddModal,
}: {
  milestoneId: string
  onAdd: (task: Task) => void
  showAddModal: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('2人共通')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const openForm = useCallback(() => {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const closeForm = useCallback(() => {
    setIsOpen(false)
    setTitle('')
    setAssignee('2人共通')
  }, [])

  const handleAdd = useCallback(async () => {
    if (!title.trim() || saving) return
    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          milestone_id: milestoneId,
          title: title.trim(),
          assignee,
          is_completed: false,
          is_auto_savings: false,
          sort_order: 999,
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        onAdd(data as Task)
        setTitle('')
        inputRef.current?.focus()
      }
    } catch {
      // エラー時は何もしない
    } finally {
      setSaving(false)
    }
  }, [title, assignee, milestoneId, onAdd, saving])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault()
        handleAdd()
      }
      if (e.key === 'Escape') closeForm()
    },
    [handleAdd, closeForm]
  )

  if (!isOpen) {
    return (
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={openForm}
          className="flex items-center gap-1.5 text-xs text-text-sub/60 hover:text-primary transition-colors py-1.5 group"
        >
          <span className="w-5 h-5 rounded-full border border-dashed border-text-sub/30 group-hover:border-primary flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </span>
          目標を追加
        </button>
        <span className="text-text-sub/20">|</span>
        <button
          onClick={showAddModal}
          className="text-xs text-text-sub/40 hover:text-primary transition-colors py-1.5"
        >
          詳細入力
        </button>
      </div>
    )
  }

  return (
    <div
      className="mt-4 p-3 rounded-xl border border-primary/15 bg-primary-light/5 space-y-2"
      style={{ animation: 'fade-slide-up 0.2s ease-out' }}
    >
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="目標のタイトル"
        maxLength={100}
        className="w-full bg-white/80 rounded-lg px-3 py-2 text-sm text-text border border-primary/10 focus:outline-none focus:border-primary/30 transition-colors placeholder:text-text-sub/40"
      />
      <div className="flex items-center gap-2">
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="flex-1 bg-white/80 rounded-lg px-3 py-1.5 text-xs text-text border border-primary/10 focus:outline-none focus:border-primary/30 transition-colors appearance-none"
        >
          <option value="しんご">しんご</option>
          <option value="あいり">あいり</option>
          <option value="2人共通">2人で</option>
          <option value="各自">各自</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={saving || !title.trim()}
          className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '...' : '追加'}
        </button>
        <button
          onClick={closeForm}
          className="px-2 py-1.5 text-xs text-text-sub hover:text-text transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
