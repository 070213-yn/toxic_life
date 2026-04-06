'use client'

import { useState, useCallback } from 'react'
import type { Milestone, Task } from '@/lib/types'
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

  // ステータスに応じたスタイル
  const statusStyles = isCompleted
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
        {/* ヘッダー部分（タップで展開） */}
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
                {milestone.deadline && (
                  <span className="text-xs text-text-sub">
                    〜{new Date(milestone.deadline).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>

              {/* タイトル */}
              <h3 className="font-bold text-text text-base leading-snug">
                {milestone.reward_emoji && (
                  <span className="mr-1.5">{milestone.reward_emoji}</span>
                )}
                {milestone.title}
              </h3>

              {/* サブタイトル */}
              {milestone.subtitle && (
                <p className="text-text-sub text-xs mt-0.5">{milestone.subtitle}</p>
              )}

              {/* ご褒美 */}
              {milestone.reward && (
                <p className="text-xs text-accent mt-1.5">
                  ご褒美: {milestone.reward}
                </p>
              )}
            </div>

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
              className={`shrink-0 text-text-sub transition-transform duration-300 mt-1 ${
                expanded ? 'rotate-180' : ''
              }`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
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
