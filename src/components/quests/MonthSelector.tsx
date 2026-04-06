'use client'

import { useCallback, useMemo } from 'react'

type Props = {
  currentMonth: string // 'YYYY-MM' 形式
  onChange: (month: string | null) => void // null は全期間
  showAll: boolean // 全期間表示中かどうか
}

// 月セレクター
// 左右矢印で月を移動し、「全期間」トグルで全表示切り替え
export default function MonthSelector({ currentMonth, onChange, showAll }: Props) {
  // 年月を日本語表記に変換（例: "2026年5月"）
  const displayLabel = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number)
    return `${year}年${month}月`
  }, [currentMonth])

  // 前の月に移動
  const goToPrevMonth = useCallback(() => {
    const [year, month] = currentMonth.split('-').map(Number)
    const date = new Date(year, month - 2, 1) // month-1（0始まり）からさらに-1
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    onChange(newMonth)
  }, [currentMonth, onChange])

  // 次の月に移動
  const goToNextMonth = useCallback(() => {
    const [year, month] = currentMonth.split('-').map(Number)
    const date = new Date(year, month, 1) // month（0始まりなので+1相当）
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    onChange(newMonth)
  }, [currentMonth, onChange])

  // 全期間トグル
  const toggleShowAll = useCallback(() => {
    if (showAll) {
      // 全期間解除 → 現在の月に戻す
      onChange(currentMonth)
    } else {
      onChange(null)
    }
  }, [showAll, currentMonth, onChange])

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-3">
      {/* 月ナビゲーション */}
      <div className={`flex items-center gap-2 transition-opacity ${showAll ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        {/* 前月ボタン */}
        <button
          onClick={goToPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-light/40 text-primary hover:bg-primary-light/70 transition-colors"
          aria-label="前の月"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* 現在の月表示 */}
        <span className="text-sm font-bold text-text min-w-[100px] text-center bg-primary-light/20 px-3 py-1 rounded-full">
          {displayLabel}
        </span>

        {/* 次月ボタン */}
        <button
          onClick={goToNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-light/40 text-primary hover:bg-primary-light/70 transition-colors"
          aria-label="次の月"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 全期間トグルボタン */}
      <button
        onClick={toggleShowAll}
        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
          showAll
            ? 'bg-accent text-white shadow-sm'
            : 'bg-text-sub/10 text-text-sub hover:bg-text-sub/20'
        }`}
      >
        全期間
      </button>
    </div>
  )
}
