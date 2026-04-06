'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

// 担当者のグループ定義（表示名をマッピング）
const ASSIGNEE_GROUPS = [
  { key: 'しんご', label: 'しんご', icon: '🐻' },
  { key: 'あいり', label: 'あいり', icon: '🐰' },
  { key: '2人共通', label: '2人で', icon: '👫' },
] as const

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

      // 楽観的UI更新
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
  const grouped = ASSIGNEE_GROUPS.map((group) => ({
    ...group,
    tasks: tasks.filter((t) => t.assignee === group.key),
  })).filter((g) => g.tasks.length > 0)

  return (
    <div className="pt-4 space-y-5">
      {grouped.map((group) => (
        <div key={group.key}>
          {/* 担当者ラベル */}
          <p className="text-xs font-bold text-text-sub/80 mb-2 flex items-center gap-1.5">
            <span>{group.icon}</span>
            {group.label}
          </p>

          {/* タスク一覧 */}
          <div className="space-y-1">
            {group.tasks.map((task) => (
              <div key={task.id}>
                <TaskItem
                  task={task}
                  totalSavings={totalSavings}
                  savingsGoal={savingsGoal}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
                {/* 完了済みタスクにリアクション表示 */}
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
// チェック時にバウンスアニメーション付き
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
  const [justChecked, setJustChecked] = useState(false)

  // 貯金連動タスクの自動判定
  const isAutoAchieved =
    task.is_auto_savings && savingsGoal !== null && totalSavings >= savingsGoal

  // チェック切り替え時にバウンスアニメーション
  const handleToggle = useCallback(() => {
    if (!task.is_completed) {
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 400)
    }
    onToggle(task)
  }, [task, onToggle])

  // 貯金連動タスクの進捗計算
  const savingsProgress = task.is_auto_savings && savingsGoal
    ? Math.min(totalSavings / savingsGoal, 1)
    : null

  const formatYen = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

  return (
    <div
      className={`group flex items-start gap-3 py-2 px-3 rounded-xl transition-all duration-200 hover:bg-primary/5 ${
        task.is_completed ? 'opacity-50' : ''
      }`}
    >
      {/* チェックボックス（丸型） */}
      <button
        onClick={handleToggle}
        disabled={task.is_auto_savings}
        className={`shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          task.is_completed || isAutoAchieved
            ? 'bg-success border-success'
            : 'border-text-sub/30 hover:border-primary'
        } ${task.is_auto_savings ? 'cursor-default' : 'cursor-pointer active:scale-[0.85]'}`}
        style={{
          animation: justChecked ? 'check-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}
      >
        {(task.is_completed || isAutoAchieved) && (
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>

      {/* タスク内容 */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug transition-all duration-300 ${
            task.is_completed ? 'line-through text-text-sub' : 'text-text'
          }`}
        >
          {task.title}
        </p>

        {/* 貯金連動タスクのプログレスバー */}
        {task.is_auto_savings && savingsGoal && savingsProgress !== null && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-success/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-success/60 to-success transition-all duration-500"
                style={{ width: `${savingsProgress * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-text-sub shrink-0">
              {formatYen(totalSavings)}/{formatYen(savingsGoal)}
            </span>
          </div>
        )}

        {/* メモ */}
        {task.memo && (
          <p className="text-xs text-text-sub/70 mt-0.5 truncate">{task.memo}</p>
        )}
      </div>

      {/* 自動判定バッジ */}
      {task.is_auto_savings && (
        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
          </svg>
          自動
        </span>
      )}

      {/* 削除ボタン（ホバー時表示） */}
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-text-sub/40 hover:text-accent transition-all duration-200 p-1 mt-0.5"
        aria-label="タスクを削除"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  )
}
