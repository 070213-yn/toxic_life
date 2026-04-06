'use client'

import { useMemo } from 'react'
import type { Milestone } from '@/lib/types'
import { MilestoneCard } from './MilestoneCard'

type Props = {
  milestones: Milestone[]
  totalSavings: number
}

// クエストページ全体のクライアントコンポーネント
// 上部にサマリー、下にマイルストーンカード一覧を表示
export default function QuestsPage({ milestones, totalSavings }: Props) {
  // 完了/未完了の分類
  const { completed, incomplete, totalCount, completedCount, nextMilestone } = useMemo(() => {
    const comp = milestones.filter((m) => m.is_completed)
    const incomp = milestones.filter((m) => !m.is_completed)

    // 次の期限があるマイルストーンを探す
    const next = incomp.find((m) => m.deadline) ?? incomp[0] ?? null

    return {
      completed: comp,
      incomplete: incomp,
      totalCount: milestones.length,
      completedCount: comp.length,
      nextMilestone: next,
    }
  }, [milestones])

  // 全体の進捗率
  const overallProgress = totalCount > 0 ? completedCount / totalCount : 0

  // 次のマイルストーンまでの残り日数を計算
  const daysUntilNext = useMemo(() => {
    if (!nextMilestone?.deadline) return null
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const deadline = new Date(nextMilestone.deadline)
    deadline.setHours(0, 0, 0, 0)
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [nextMilestone])

  return (
    <div className="px-4 pb-28 max-w-lg mx-auto">
      {/* --- 全体の進捗サマリー --- */}
      <div className="mb-6 p-5 rounded-2xl bg-bg-card border border-primary-light/40 shadow-sm">
        {/* クリア数表示 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-text">
            {completedCount}/{totalCount} クリア
          </span>
          <span className="text-xs text-text-sub">
            {Math.round(overallProgress * 100)}%
          </span>
        </div>

        {/* プログレスバー（グラデーション） */}
        <div className="h-3 bg-primary-light/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${overallProgress * 100}%`,
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              animation: 'bar-fill 1s ease-out',
            }}
          />
        </div>

        {/* 次の目標表示 */}
        {nextMilestone && (
          <p className="mt-3 text-xs text-text-sub">
            次の目標:{' '}
            <span className="font-medium text-text">{nextMilestone.title}</span>
            {daysUntilNext !== null && (
              <span className={`ml-1 ${daysUntilNext < 7 ? 'text-accent font-medium' : ''}`}>
                （あと{daysUntilNext}日）
              </span>
            )}
          </p>
        )}
      </div>

      {/* --- マイルストーンカード一覧 --- */}
      {milestones.length === 0 ? (
        <div className="text-center py-16 text-text-sub">
          <p className="text-4xl mb-4">
            {/* 巻物のアイコン（絵文字を使用） */}
          </p>
          <p>まだクエストがありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 未完了マイルストーン（上に表示） */}
          {incomplete.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              totalSavings={totalSavings}
              defaultExpanded={true}
            />
          ))}

          {/* 完了済みマイルストーン（下に表示、薄く） */}
          {completed.length > 0 && (
            <div className="pt-4 space-y-4">
              <p className="text-xs font-medium text-text-sub/60 uppercase tracking-wider">
                -- クリア済み --
              </p>
              {completed.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  totalSavings={totalSavings}
                  defaultExpanded={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
