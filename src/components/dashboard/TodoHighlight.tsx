'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

type Props = {
  tasks: Task[]
}

// 今月のやること
export default function TodoHighlight({ tasks }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localTasks, setLocalTasks] = useState(tasks)

  const toggleTask = async (taskId: string, currentDone: boolean) => {
    const newDone = !currentDone
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, is_completed: newDone, completed_at: newDone ? new Date().toISOString() : null }
          : t
      )
    )

    const { error } = await supabase
      .from('tasks')
      .update({
        is_completed: newDone,
        completed_at: newDone ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

    if (error) {
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, is_completed: currentDone, completed_at: null } : t
        )
      )
      return
    }

    startTransition(() => {
      router.refresh()
    })
  }

  if (localTasks.length === 0) {
    return null
  }

  // 担当者別にグループ化
  const grouped: Record<string, Task[]> = {}
  for (const t of localTasks.slice(0, 8)) {
    const key = t.assignee
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  }

  // チェック直後のバウンスアニメーション制御
  const [justCheckedId, setJustCheckedId] = useState<string | null>(null)

  const handleToggle = useCallback((taskId: string, currentDone: boolean) => {
    if (!currentDone) {
      setJustCheckedId(taskId)
      setTimeout(() => setJustCheckedId(null), 400)
    }
    toggleTask(taskId, currentDone)
  }, [toggleTask])

  return (
    <div className="rounded-2xl bg-bg-card p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-text">今月のやること</h2>
        <a href="/quests" className="text-xs text-primary hover:text-primary/80 transition-colors">
          すべて見る &rarr;
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([assignee, assigneeTasks], groupIdx) => (
          <div
            key={assignee}
            style={{
              animation: 'fade-slide-up 0.4s ease-out both',
              animationDelay: `${groupIdx * 80}ms`,
            }}
          >
            {/* 担当者ラベル */}
            <div className="mb-2">
              <span className={`
                text-[11px] px-2 py-0.5 rounded-full font-medium
                ${assignee === 'しんご'
                  ? 'bg-primary-light text-primary'
                  : assignee === 'あいり'
                    ? 'bg-accent/20 text-accent'
                    : 'bg-gray-100 text-text-sub'
                }
              `}>
                {assignee}
              </span>
            </div>

            {/* タスクリスト */}
            <ul className="space-y-2">
              {assigneeTasks.map((task) => (
                <li key={task.id} className="flex items-start gap-2 group">
                  <button
                    onClick={() => handleToggle(task.id, task.is_completed)}
                    disabled={isPending}
                    className={`
                      w-4 h-4 mt-0.5 rounded border-2 flex-shrink-0
                      flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-[0.85]
                      ${task.is_completed
                        ? 'bg-success border-success'
                        : 'border-gray-300 hover:border-primary'
                      }
                    `}
                    style={{
                      animation: justCheckedId === task.id
                        ? 'check-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        : 'none',
                    }}
                  >
                    {task.is_completed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm leading-tight transition-all duration-300 ${task.is_completed ? 'line-through text-text-sub opacity-50' : 'text-text'}`}>
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
