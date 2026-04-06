'use client'

import { useState, useCallback, useRef } from 'react'
import type { Milestone, Task } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
import { TaskList } from './TaskList'
import { AddTaskModal } from './AddTaskModal'
import { ConfettiEffect } from './ConfettiEffect'

type Props = {
  milestone: Milestone
  totalSavings: number
}

// マイルストーンカード
// タップで展開してタスクリストを表示する
export function MilestoneCard({ milestone, totalSavings }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(milestone.tasks ?? [])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // 編集モード関連の状態
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editTitle, setEditTitle] = useState(milestone.title)
  const [editSubtitle, setEditSubtitle] = useState(milestone.subtitle ?? '')
  const [editDeadline, setEditDeadline] = useState(milestone.deadline ?? '')
  const [editReward, setEditReward] = useState(milestone.reward ?? '')

  // 現在表示用の値（保存後に反映するためローカルで管理）
  const [currentTitle, setCurrentTitle] = useState(milestone.title)
  const [currentSubtitle, setCurrentSubtitle] = useState(milestone.subtitle)
  const [currentDeadline, setCurrentDeadline] = useState(milestone.deadline)
  const [currentReward, setCurrentReward] = useState(milestone.reward)

  // 編集モードを開始
  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // カードの展開を防ぐ
    setEditTitle(currentTitle)
    setEditSubtitle(currentSubtitle ?? '')
    setEditDeadline(currentDeadline ?? '')
    setEditReward(currentReward ?? '')
    setIsEditing(true)
  }, [currentTitle, currentSubtitle, currentDeadline, currentReward])

  // 編集をキャンセル
  const cancelEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(false)
  }, [])

  // 編集を保存（Supabaseに更新）
  const saveEditing = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSaving(true)

    const { error } = await supabase
      .from('milestones')
      .update({
        title: editTitle.trim(),
        subtitle: editSubtitle.trim() || null,
        deadline: editDeadline || null,
        reward: editReward.trim() || null,
      })
      .eq('id', milestone.id)

    setIsSaving(false)

    if (error) {
      alert('保存に失敗しました: ' + error.message)
      return
    }

    // ローカル状態を更新
    setCurrentTitle(editTitle.trim())
    setCurrentSubtitle(editSubtitle.trim() || null)
    setCurrentDeadline(editDeadline || null)
    setCurrentReward(editReward.trim() || null)
    setIsEditing(false)
  }, [editTitle, editSubtitle, editDeadline, editReward, milestone.id])

  // タスクの完了数・全数
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.is_completed).length
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0

  // ステータス判定
  const isCompleted = milestone.is_completed || (totalTasks > 0 && completedTasks === totalTasks)
  const isInProgress = !isCompleted && completedTasks > 0
  // 未開始: isCompleted=false, completedTasks=0

  // タスク更新時のコールバック（楽観的UIを実現）
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
  }, [])

  // タスク削除時のコールバック
  const handleTaskDelete = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  // タスク追加時のコールバック
  const handleTaskAdd = useCallback((newTask: Task) => {
    setTasks((prev) => [...prev, newTask])
  }, [])

  // マイルストーン達成時の紙吹雪トリガー
  const handleMilestoneComplete = useCallback(() => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }, [])

  // ステータスに応じたスタイル（編集中は枠線を強調）
  const statusStyles = isEditing
    ? 'border-primary border-2 bg-primary-light/10 shadow-md'
    : isCompleted
      ? 'border-success/30 bg-success/5'
      : isInProgress
        ? 'border-primary/30 bg-primary-light/10'
        : 'border-text-sub/10 bg-bg-card'

  return (
    <>
      {showConfetti && <ConfettiEffect />}

      <div
        className={`rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${statusStyles}`}
      >
        {/* ヘッダー部分 */}
        {isEditing ? (
          /* === 編集モード === */
          <div className="p-5" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-3">
              {/* タイトル入力 */}
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">タイトル</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="例: 冒険の始まり"
                />
              </div>

              {/* サブタイトル入力 */}
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">サブタイトル</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="例: MS1"
                />
              </div>

              {/* 期限入力 */}
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">期限</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              {/* ご褒美入力 */}
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">ご褒美</label>
                <input
                  type="text"
                  value={editReward}
                  onChange={(e) => setEditReward(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="例: 美味しいディナー"
                />
              </div>

              {/* 保存・キャンセルボタン */}
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
          /* === 通常表示モード === */
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-left p-5 transition-colors hover:bg-primary/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* ステータスバッジ */}
                <div className="flex items-center gap-2 mb-2">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                      達成済み
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      進行中
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-text-sub bg-text-sub/10 px-2 py-0.5 rounded-full">
                      未開始
                    </span>
                  )}

                  {/* 期限表示 */}
                  {currentDeadline && (
                    <span className="text-xs text-text-sub">
                      〜{new Date(currentDeadline).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* タイトル */}
                <h3 className="font-bold text-text text-base leading-snug">
                  {milestone.reward_emoji && (
                    <span className="mr-1.5">{milestone.reward_emoji}</span>
                  )}
                  {currentTitle}
                </h3>

                {/* サブタイトル */}
                {currentSubtitle && (
                  <p className="text-text-sub text-xs mt-0.5">{currentSubtitle}</p>
                )}

                {/* ご褒美 */}
                {currentReward && (
                  <p className="text-xs text-accent mt-1.5">
                    ご褒美: {currentReward}
                  </p>
                )}
              </div>

              {/* 編集ボタンと展開矢印 */}
              <div className="flex items-center gap-1.5 shrink-0 mt-1">
                {/* 編集ボタン */}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={startEditing}
                  onKeyDown={(e) => { if (e.key === 'Enter') startEditing(e as unknown as React.MouseEvent) }}
                  className="p-1.5 rounded-lg text-text-sub/60 hover:text-primary hover:bg-primary/10 transition-colors"
                  title="マイルストーンを編集"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </span>

                {/* 展開矢印 */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-text-sub transition-transform duration-300 ${
                    expanded ? 'rotate-180' : ''
                  }`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>

            {/* プログレスバー */}
            {totalTasks > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-text-sub mb-1">
                  <span>{completedTasks}/{totalTasks} タスク完了</span>
                  <span>{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-2 bg-text-sub/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isCompleted ? 'bg-success' : 'bg-primary'
                    }`}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            )}
          </button>
        )}

        {/* 展開コンテンツ（タスクリスト） */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-5 pb-5 border-t border-text-sub/5">
            {/* 貯金目標プログレス（savings_goal がある場合のみ表示） */}
            {milestone.savings_goal !== null && milestone.savings_goal > 0 && (
              <SavingsProgress
                totalSavings={totalSavings}
                savingsGoal={milestone.savings_goal}
              />
            )}

            {/* タスクリスト */}
            <TaskList
              tasks={tasks}
              totalSavings={totalSavings}
              savingsGoal={milestone.savings_goal}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onAllTasksComplete={handleMilestoneComplete}
            />

            {/* インライン目標追加フォーム */}
            <InlineAddTask
              milestoneId={milestone.id}
              onAdd={handleTaskAdd}
              showAddModal={() => setShowAddModal(true)}
            />
          </div>
        </div>
      </div>

      {/* タスク追加モーダル */}
      {showAddModal && (
        <AddTaskModal
          milestoneId={milestone.id}
          onClose={() => setShowAddModal(false)}
          onAdd={handleTaskAdd}
        />
      )}
    </>
  )
}

// 貯金目標プログレス表示コンポーネント
// 貯金目標額に対する現在の達成率をバーで表示
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

  // 金額のフォーマット（例: ¥100,000）
  const formatYen = (amount: number) =>
    `¥${amount.toLocaleString('ja-JP')}`

  return (
    <div className="mt-4 mb-2 p-3 rounded-xl bg-success/5 border border-success/15">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {/* 貯金アイコン */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-success"
          >
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
            <path d="M2 9v1c0 1.1.9 2 2 2h1" />
            <path d="M16 11h.01" />
          </svg>
          <span className="text-xs font-medium text-success">
            貯金 {formatYen(savingsGoal)}
            {achieved ? ' 達成!' : ' 目標'}
          </span>
        </div>
        <span className="text-xs text-text-sub">
          {formatYen(totalSavings)} / {formatYen(savingsGoal)}
        </span>
      </div>

      {/* プログレスバー（ミントグリーン） */}
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

      {/* 達成時のメッセージ */}
      {achieved && (
        <p className="text-xs text-success mt-1.5 text-center font-medium">
          目標達成おめでとう!
        </p>
      )}

      {/* 未達時の残り金額 */}
      {!achieved && (
        <p className="text-xs text-text-sub mt-1 text-right">
          あと {formatYen(savingsGoal - totalSavings)}
        </p>
      )}
    </div>
  )
}

// インライン目標追加コンポーネント
// 「+ 目標を追加」テキストリンクをクリックすると入力欄が表示される
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

  // フォームを開く
  const openForm = useCallback(() => {
    setIsOpen(true)
    // 少し遅延させてフォーカス（DOMレンダリング待ち）
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // フォームをリセットして閉じる
  const closeForm = useCallback(() => {
    setIsOpen(false)
    setTitle('')
    setAssignee('2人共通')
  }, [])

  // タスクを追加
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
        // 追加成功 → フォームをリセット（開いたまま連続追加可能）
        setTitle('')
        inputRef.current?.focus()
      }
    } catch {
      // エラー時は何もしない
    } finally {
      setSaving(false)
    }
  }, [title, assignee, milestoneId, onAdd, saving])

  // Enterキーで追加
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault()
        handleAdd()
      }
      if (e.key === 'Escape') {
        closeForm()
      }
    },
    [handleAdd, closeForm]
  )

  if (!isOpen) {
    return (
      <div className="mt-3 flex items-center gap-2">
        {/* インライン追加（テキストリンクスタイル） */}
        <button
          onClick={openForm}
          className="flex items-center gap-1 text-xs text-text-sub/70 hover:text-primary transition-colors py-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          目標を追加
        </button>

        {/* 詳細フォームで追加（モーダルを開く） */}
        <span className="text-text-sub/30">|</span>
        <button
          onClick={showAddModal}
          className="text-xs text-text-sub/50 hover:text-primary transition-colors py-1.5"
        >
          詳細入力
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 p-3 rounded-xl border border-primary/15 bg-primary-light/5 space-y-2">
      {/* タスク名入力 */}
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

      {/* 担当者セレクト + ボタン */}
      <div className="flex items-center gap-2">
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="flex-1 bg-white/80 rounded-lg px-3 py-1.5 text-xs text-text border border-primary/10 focus:outline-none focus:border-primary/30 transition-colors appearance-none"
        >
          <option value="しんご">しんご</option>
          <option value="あいり">あいり</option>
          <option value="2人共通">2人共通</option>
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
