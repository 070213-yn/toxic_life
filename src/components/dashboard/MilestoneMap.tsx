'use client'

import { useState, useRef, useEffect } from 'react'
import type { Milestone } from '@/lib/types'

type Props = {
  milestones: Milestone[]
}

// 横スクロールのロードマップUI
// マイルストーンを道のりとして視覚化する
// クリックするとノードの下に詳細パネルが展開される
export default function MilestoneMap({ milestones }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  // 詳細パネルの高さをアニメーションするためのref
  const detailRef = useRef<HTMLDivElement>(null)
  const [detailHeight, setDetailHeight] = useState(0)

  // 完了済みの最後のインデックスを取得して「現在位置」を決定
  const currentIndex = milestones.findIndex((m) => !m.is_completed)

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // 展開されたマイルストーンを取得
  const expandedMilestone = milestones.find((m) => m.id === expandedId)

  // 詳細パネルの高さを計測してスムーズなアニメーションに使う
  useEffect(() => {
    if (detailRef.current && expandedId) {
      setDetailHeight(detailRef.current.scrollHeight)
    } else {
      setDetailHeight(0)
    }
  }, [expandedId])

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

      {/* 横スクロールコンテナ（ノード部分のみ） */}
      <div className="overflow-x-auto pb-2 -mx-2">
        <div className="flex items-center gap-0 min-w-max px-2">
          {milestones.map((milestone, index) => {
            const isCompleted = milestone.is_completed
            const isCurrent = index === currentIndex
            const isExpanded = expandedId === milestone.id

            return (
              <div key={milestone.id} className="flex items-center">
                {/* マイルストーンノード */}
                <div className="flex flex-col items-center w-28">
                  {/* アイコン円 */}
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
                      ${isExpanded ? 'ring-3 ring-primary/30 scale-110' : ''}
                      hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]
                    `}
                    style={{
                      // 進行中マイルストーンにgentle-pulseアニメーション
                      animation: isCurrent && !isExpanded
                        ? 'gentle-pulse 2.5s ease-in-out infinite'
                        : 'none',
                    }}
                  >
                    {isCompleted ? (
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
                  {isCurrent && !isExpanded && (
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary animate-bounce" />
                  )}

                  {/* 選択中インジケーター */}
                  {isExpanded && (
                    <div className="mt-1.5 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary/60" />
                  )}

                  {/* マイルストーン名 */}
                  <p
                    className={`
                      mt-1.5 text-xs text-center font-medium leading-tight
                      ${isCompleted ? 'text-success' : isCurrent ? 'text-primary' : 'text-gray-400'}
                      ${isExpanded ? 'font-bold' : ''}
                    `}
                  >
                    {milestone.title}
                  </p>
                </div>

                {/* マイルストーン間の接続線 */}
                {index < milestones.length - 1 && (
                  <div className="flex items-center -mt-6">
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

      {/* 詳細パネル - ノードの下に全幅で展開 */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: expandedId ? `${detailHeight + 16}px` : '0px' }}
      >
        {expandedMilestone && (
          <div ref={detailRef} className="mt-4 rounded-xl bg-bg p-5 border border-primary-light/30">
            {/* ヘッダー: タイトルと期限 */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-text">
                  {expandedMilestone.title}
                </h3>
                {expandedMilestone.description && (
                  <p className="text-sm text-text-sub mt-1">{expandedMilestone.description}</p>
                )}
              </div>
              {expandedMilestone.deadline && (
                <span className="text-xs text-text-sub bg-primary-light/20 px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                  期限: {new Date(expandedMilestone.deadline).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            {/* タスクリスト */}
            {expandedMilestone.tasks && expandedMilestone.tasks.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-text-sub mb-2">
                  タスク（{expandedMilestone.tasks.filter(t => t.is_completed).length}/{expandedMilestone.tasks.length}）
                </p>
                <ul className="space-y-1.5">
                  {[...expandedMilestone.tasks]
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((task) => (
                    <li key={task.id} className="flex items-center gap-2 text-sm">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                        task.is_completed
                          ? 'bg-success/20 text-success'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {task.is_completed ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-gray-300" />
                        )}
                      </span>
                      <span className={task.is_completed ? 'line-through text-text-sub' : 'text-text'}>
                        {task.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ご褒美 */}
            {expandedMilestone.reward && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-warm/10 border border-accent-warm/20">
                <span className="text-lg">{expandedMilestone.reward_emoji || '🎁'}</span>
                <div>
                  <p className="text-xs text-text-sub">ご褒美</p>
                  <p className="text-sm font-medium text-accent-warm">{expandedMilestone.reward}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
