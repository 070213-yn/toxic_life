'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import type { Milestone } from '@/lib/types'

// リアルタイム監視対象テーブル（ダッシュボード用）
const REALTIME_TABLES = ['tasks', 'savings', 'milestones']

type Props = {
  milestone: Milestone | null
}

export default function TodoHighlight({ milestone }: Props) {
  useRealtimeRefresh(REALTIME_TABLES)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [justCheckedId, setJustCheckedId] = useState<string | null>(null)

  // タスクのローカル状態
  const tasks = milestone?.tasks || []
  const [localTasks, setLocalTasks] = useState(tasks)

  const completedCount = localTasks.filter((t) => t.is_completed).length
  const totalCount = localTasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const toggleTask = useCallback(async (taskId: string, currentDone: boolean) => {
    const newDone = !currentDone
    if (!currentDone) {
      setJustCheckedId(taskId)
      setTimeout(() => setJustCheckedId(null), 400)
    }

    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, is_completed: newDone, completed_at: newDone ? new Date().toISOString() : null }
          : t
      )
    )

    await supabase
      .from('tasks')
      .update({ is_completed: newDone, completed_at: newDone ? new Date().toISOString() : null })
      .eq('id', taskId)

    startTransition(() => router.refresh())
  }, [router])

  // 担当者の色
  const assigneeColor = (assignee: string) => {
    if (assignee === 'しんご') return 'text-primary'
    if (assignee === 'あいり') return 'text-accent'
    return 'text-text-sub'
  }

  if (!milestone) {
    return (
      <div className="w-full flex-1 rounded-2xl bg-bg-card p-5 shadow-sm flex items-center justify-center">
        <p className="text-sm text-text-sub">全チャプタークリア！</p>
      </div>
    )
  }

  // 未完了を先に、sort_order順
  const sortedTasks = [...localTasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1
    return a.sort_order - b.sort_order
  })

  return (
    <div className="w-full flex-1 rounded-2xl bg-bg-card p-5 shadow-sm flex flex-col">
      {/* チャプターヘッダー */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">
            Chapter {milestone.sort_order}
          </span>
          <h2 className="text-sm font-bold text-text">{milestone.title}</h2>
        </div>
        <a href="/quests" className="text-[11px] text-primary hover:text-primary/80 transition-colors">
          詳細 &rarr;
        </a>
      </div>

      {/* プログレスバー */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-text-sub">{completedCount}/{totalCount} 完了</span>
          <span className="text-[11px] font-medium text-primary">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-primary-light/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, animation: 'bar-fill 0.8s ease-out' }}
          />
        </div>
      </div>

      {/* タスクリスト */}
      <ul className="space-y-1 flex-1 overflow-y-auto">
        {sortedTasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2 py-0.5">
            <button
              onClick={() => toggleTask(task.id, task.is_completed)}
              disabled={isPending}
              className={`w-3.5 h-3.5 rounded border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.85]
                ${task.is_completed ? 'bg-success border-success' : 'border-gray-300 hover:border-primary'}`}
              style={{
                animation: justCheckedId === task.id ? 'check-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
              }}
            >
              {task.is_completed && (
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`text-xs leading-snug flex-1 transition-all duration-200 ${task.is_completed ? 'line-through text-text-sub/40' : 'text-text'}`}>
              {task.title}
            </span>
            <span className={`text-[10px] shrink-0 ${assigneeColor(task.assignee)}`}>
              {task.assignee === '2人共通' ? '2人' : task.assignee}
            </span>
          </li>
        ))}
      </ul>

      {/* ご褒美 */}
      {milestone.reward && (
        <div className="mt-2 pt-2 border-t border-primary-light/20">
          <p className="text-[11px] text-accent-warm">
            <span className="mr-1">🎁</span>{milestone.reward}
          </p>
        </div>
      )}
    </div>
  )
}
