'use client'

import { useState, useCallback } from 'react'
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
            {/* タスクリスト */}
            <TaskList
              tasks={tasks}
              totalSavings={totalSavings}
              savingsGoal={milestone.savings_goal}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onAllTasksComplete={handleMilestoneComplete}
            />

            {/* タスク追加ボタン */}
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 hover:bg-primary/5 py-2.5 rounded-xl transition-colors"
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
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              タスクを追加
            </button>
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
