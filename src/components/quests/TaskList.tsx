'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { Task } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
import { TaskReactions } from '@/components/quests/TaskReactions'

type Props = {
  tasks: Task[]
  totalSavings: number
  savingsGoal: number | null
  onTaskUpdate: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onAllTasksComplete: () => void
}

// 担当者のグループ定義
const ASSIGNEE_GROUPS = ['しんご', 'あいり', '2人共通'] as const

// タスクリストコンポーネント
// 担当者別にグループ化して表示、チェックボックスで完了切り替え
export function TaskList({
  tasks,
  totalSavings,
  savingsGoal,
  onTaskUpdate,
  onTaskDelete,
  onAllTasksComplete,
}: Props) {
  // 前回の完了数を記録（全タスク完了検知用）
  const prevCompletedRef = useRef(tasks.filter((t) => t.is_completed).length)

  // 全タスク完了を検知
  useEffect(() => {
    const completedCount = tasks.filter((t) => t.is_completed).length
    const prevCompleted = prevCompletedRef.current
    prevCompletedRef.current = completedCount

    // 全タスク完了 & 前回は未完了だった場合のみトリガー
    if (tasks.length > 0 && completedCount === tasks.length && prevCompleted < tasks.length) {
      onAllTasksComplete()
    }
  }, [tasks, onAllTasksComplete])

  // タスクの完了状態を切り替え
  const handleToggle = useCallback(
    async (task: Task) => {
      const newCompleted = !task.is_completed
      const updatedTask: Task = {
        ...task,
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      }

      // 楽観的UI更新（先にUIを変更してからDB保存）
      onTaskUpdate(updatedTask)

      await supabase
        .from('tasks')
        .update({
          is_completed: newCompleted,
          completed_at: updatedTask.completed_at,
        })
        .eq('id', task.id)
    },
    [onTaskUpdate]
  )

  // タスク削除
  const handleDelete = useCallback(
    async (taskId: string) => {
      // 楽観的UI更新
      onTaskDelete(taskId)

      await supabase.from('tasks').delete().eq('id', taskId)
    },
    [onTaskDelete]
  )

  if (tasks.length === 0) {
    return (
      <p className="text-center text-text-sub text-sm py-6">
        まだタスクがありません
      </p>
    )
  }

  // 担当者ごとにグループ化
  const grouped = ASSIGNEE_GROUPS.map((assignee) => ({
    assignee,
    tasks: tasks.filter((t) => t.assignee === assignee),
  })).filter((g) => g.tasks.length > 0)

  return (
    <div className="pt-4 space-y-4">
      {grouped.map((group) => (
        <div key={group.assignee}>
          {/* 担当者ラベル */}
          <p className="text-xs font-medium text-text-sub mb-2 flex items-center gap-1.5">
            <AssigneeIcon assignee={group.assignee} />
            {group.assignee}
          </p>

          {/* タスク一覧 */}
          <div className="space-y-1.5">
            {group.tasks.map((task) => (
              <div key={task.id}>
                <TaskItem
                  task={task}
                  totalSavings={totalSavings}
                  savingsGoal={savingsGoal}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
                {/* 完了済みタスクにリアクション＆コメント表示 */}
                <TaskReactions
                  taskId={task.id}
                  isCompleted={task.is_completed}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 個別タスクアイテム
function TaskItem({
  task,
  totalSavings,
  savingsGoal,
  onToggle,
  onDelete,
}: {
  task: Task
  totalSavings: number
  savingsGoal: number | null
  onToggle: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  // 貯金連動タスクの自動判定
  const isAutoAchieved =
    task.is_auto_savings && savingsGoal !== null && totalSavings >= savingsGoal

  return (
    <div
      className={`group flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-200 hover:bg-primary/5 ${
        task.is_completed ? 'opacity-60' : ''
      }`}
    >
      {/* チェックボックス */}
      <button
        onClick={() => onToggle(task)}
        disabled={task.is_auto_savings}
        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          task.is_completed || isAutoAchieved
            ? 'bg-success border-success scale-110'
            : 'border-text-sub/30 hover:border-primary'
        } ${task.is_auto_savings ? 'cursor-default' : 'cursor-pointer active:scale-90'}`}
        style={{
          // チェック時のバウンスアニメーション
          animation: task.is_completed ? 'check-bounce 0.3s ease-out' : 'none',
        }}
      >
        {(task.is_completed || isAutoAchieved) && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>

      {/* タスク内容 */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug ${
            task.is_completed ? 'line-through text-text-sub' : 'text-text'
          }`}
        >
          {task.title}
        </p>
        {/* メモ表示 */}
        {task.memo && (
          <p className="text-xs text-text-sub mt-0.5 truncate">{task.memo}</p>
        )}
        {/* 期限表示 */}
        {task.due_date && (
          <p className="text-xs text-accent-warm mt-0.5">
            〜{new Date(task.due_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>

      {/* 自動判定バッジ */}
      {task.is_auto_savings && (
        <span className="shrink-0 text-xs bg-accent-warm/15 text-accent-warm px-2 py-0.5 rounded-full">
          貯金連動
        </span>
      )}

      {/* 削除ボタン（ホバー時表示） */}
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-text-sub hover:text-accent transition-all p-1"
        aria-label="タスクを削除"
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
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>
    </div>
  )
}

// 担当者アイコン
function AssigneeIcon({ assignee }: { assignee: string }) {
  if (assignee === 'しんご') return <span>🐻</span>
  if (assignee === 'あいり') return <span>🐰</span>
  return <span>👫</span>
}
