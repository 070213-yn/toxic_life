'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Milestone } from '@/lib/types'
import { MilestoneCard } from './MilestoneCard'
import MonthSelector from './MonthSelector'

type Props = {
  milestones: Milestone[]
  totalSavings: number
}

// 現在の年月を 'YYYY-MM' 形式で取得
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// クエストページのクライアント側ロジック
// 月セレクターの状態管理とフィルタリングを担当
export default function QuestsPageClient({ milestones, totalSavings }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth())
  const [showAll, setShowAll] = useState(false)

  // 月変更ハンドラー（null は全期間表示）
  const handleMonthChange = useCallback((month: string | null) => {
    if (month === null) {
      setShowAll(true)
    } else {
      setShowAll(false)
      setSelectedMonth(month)
    }
  }, [])

  // 月でフィルタリングしたマイルストーン
  const filteredMilestones = useMemo(() => {
    if (showAll) return milestones

    return milestones.filter((m) => {
      if (!m.deadline) return false
      // deadline の年月を取得して比較
      const deadlineMonth = m.deadline.substring(0, 7) // 'YYYY-MM'
      return deadlineMonth === selectedMonth
    })
  }, [milestones, selectedMonth, showAll])

  return (
    <>
      {/* 月セレクター */}
      <MonthSelector
        currentMonth={selectedMonth}
        onChange={handleMonthChange}
        showAll={showAll}
      />

      {/* マイルストーン一覧 */}
      <div className="px-4 pb-24 space-y-4 max-w-lg mx-auto">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-16 text-text-sub">
            <p className="text-4xl mb-4">
              {showAll ? '📜' : '🔍'}
            </p>
            <p>
              {showAll
                ? 'まだクエストがありません'
                : `${selectedMonth.replace('-', '年')}月のクエストはありません`}
            </p>
            {!showAll && (
              <button
                onClick={() => handleMonthChange(null)}
                className="mt-3 text-xs text-primary hover:underline"
              >
                全期間を表示する
              </button>
            )}
          </div>
        ) : (
          filteredMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              totalSavings={totalSavings}
            />
          ))
        )}
      </div>
    </>
  )
}
