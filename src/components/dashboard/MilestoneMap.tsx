'use client'

import { useState } from 'react'
import type { Milestone } from '@/lib/types'

type Props = {
  milestones: Milestone[]
}

// 横スクロールのロードマップUI
// マイルストーンを道のりとして視覚化する
export default function MilestoneMap({ milestones }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 完了済みの最後のインデックスを取得して「現在位置」を決定
  const currentIndex = milestones.findIndex((m) => !m.is_completed)

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text mb-4">ロードマップ</h2>
        <div className="flex flex-col items-center py-6">
          <div className="bg-primary-light/20 rounded-full p-4 mb-3">
            <svg className="w-10 h-10 text-text-sub/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
            </svg>
          </div>
          <p className="text-text-sub text-sm">マイルストーンはまだないよ</p>
          <p className="text-text-sub/60 text-xs mt-1">クエストページから冒険を始めよう！</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-bg-card p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <h2 className="text-lg font-bold text-text mb-4">ロードマップ</h2>

      {/* 横スクロールコンテナ */}
      <div className="overflow-x-auto pb-4 -mx-2">
        <div className="flex items-start gap-0 min-w-max px-2">
          {milestones.map((milestone, index) => {
            const isCompleted = milestone.is_completed
            const isCurrent = index === currentIndex
            const isPending = !isCompleted && !isCurrent

            return (
              <div key={milestone.id} className="flex items-start">
                {/* マイルストーンノード */}
                <div className="flex flex-col items-center w-28">
                  {/* アイコン円 - 進行中はgentle-pulse、完了はcheck-bounce */}
                  <button
                    onClick={() => toggleExpand(milestone.id)}
                    className={`
                      w-14 h-14 rounded-full flex items-center justify-center text-xl
                      transition-all duration-300 cursor-pointer
                      ${isCompleted
                        ? 'bg-success text-white shadow-md'
                        : isCurrent
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-gray-200 text-gray-400'
                      }
                      hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]
                    `}
                    style={{
                      // 進行中マイルストーンにgentle-pulseアニメーション
                      animation: isCurrent
                        ? 'gentle-pulse 2.5s ease-in-out infinite'
                        : 'none',
                    }}
                  >
                    {isCompleted ? (
                      // チェックマーク - check-bounceアニメーション
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                        style={{ animation: 'check-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </button>

                  {/* 現在位置マーカー */}
                  {isCurrent && (
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary animate-bounce" />
                  )}

                  {/* マイルストーン名 */}
                  <p
                    className={`
                      mt-2 text-xs text-center font-medium leading-tight
                      ${isCompleted ? 'text-success' : isCurrent ? 'text-primary' : 'text-gray-400'}
                    `}
                  >
                    {milestone.title}
                  </p>

                  {/* 展開時の詳細（アコーディオン） */}
                  {expandedId === milestone.id && (
                    <div className="mt-2 w-40 rounded-xl bg-bg p-3 shadow-md text-left">
                      {milestone.description && (
                        <p className="text-xs text-text-sub mb-2">{milestone.description}</p>
                      )}
                      {milestone.tasks && milestone.tasks.length > 0 && (
                        <ul className="space-y-1">
                          {milestone.tasks.map((task) => (
                            <li key={task.id} className="flex items-center gap-1.5 text-xs">
                              <span className={task.is_completed ? 'text-success' : 'text-text-sub'}>
                                {task.is_completed ? '●' : '○'}
                              </span>
                              <span className={task.is_completed ? 'line-through text-text-sub' : 'text-text'}>
                                {task.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {milestone.reward && (
                        <p className="mt-2 text-xs text-accent-warm font-medium">
                          {milestone.reward_emoji} {milestone.reward}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* マイルストーン間の接続線 */}
                {index < milestones.length - 1 && (
                  <div className="flex items-center mt-6">
                    <div
                      className={`
                        w-8 h-0.5
                        ${isCompleted ? 'bg-success' : 'bg-gray-200'}
                      `}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
