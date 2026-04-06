'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

type Props = {
  tasks: Task[]
}

// 今月のTODOハイライト
// 進行中のマイルストーンから重要タスクを表示
export default function TodoHighlight({ tasks }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // ローカルで完了状態を管理（楽観的更新のため）
  const [localTasks, setLocalTasks] = useState(tasks)

  // タスク完了をSupabaseに反映
  const toggleTask = async (taskId: string, currentDone: boolean) => {
    const newDone = !currentDone

    // 楽観的更新: 先にUIを変更
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, is_completed: newDone, completed_at: newDone ? new Date().toISOString() : null }
          : t
      )
    )

    // Supabaseに保存
    const { error } = await supabase
      .from('tasks')
      .update({
        is_completed: newDone,
        completed_at: newDone ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

    if (error) {
      // エラー時はロールバック
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, is_completed: currentDone, completed_at: null } : t
        )
      )
      return
    }

    // サーバーデータを再取得
    startTransition(() => {
      router.refresh()
    })
  }

  if (localTasks.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-card p-6 shadow-sm text-center">
        <p className="text-text-sub text-sm">現在のタスクはありません</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text">今月のやること</h2>
        <a
          href="/quests"
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          すべて見る &rarr;
        </a>
      </div>

      <ul className="space-y-3">
        {localTasks.slice(0, 5).map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 group"
          >
            {/* チェックボックス */}
            <button
              onClick={() => toggleTask(task.id, task.is_completed)}
              disabled={isPending}
              className={`
                w-5 h-5 rounded-md border-2 flex-shrink-0
                flex items-center justify-center
                transition-all duration-200 cursor-pointer
                ${task.is_completed
                  ? 'bg-success border-success'
                  : 'border-gray-300 hover:border-primary group-hover:border-primary'
                }
              `}
            >
              {task.is_completed && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* タスク名 */}
            <span
              className={`
                text-sm transition-all duration-200
                ${task.is_completed ? 'line-through text-text-sub' : 'text-text'}
              `}
            >
              {task.title}
            </span>

            {/* 担当者バッジ */}
            <span
              className={`
                ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium
                ${task.assignee === 'しんご'
                  ? 'bg-primary-light text-primary'
                  : task.assignee === 'あいり'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-gray-100 text-text-sub'
                }
              `}
            >
              {task.assignee}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
