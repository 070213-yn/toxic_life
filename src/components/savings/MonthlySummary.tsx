'use client'

import { useMemo } from 'react'
import type { Saving } from '@/lib/types'

const GOAL_AMOUNT = 1000000 // 目標: 100万円

// 月別サマリーカード
// 今月の貯金額、個別の貯金額、月平均、目標達成に必要な月額を表示
export function MonthlySummary({ savings }: { savings: Saving[] }) {
  const summary = useMemo(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // 今月分の記録をフィルタ
    const thisMonth = savings.filter((s) => s.recorded_date.startsWith(currentMonth))
    const thisMonthTotal = thisMonth.reduce((sum, s) => sum + s.amount, 0)

    // 人別の今月貯金額
    const shingoThisMonth = thisMonth
      .filter((s) => s.profiles?.display_name === 'しんご')
      .reduce((sum, s) => sum + s.amount, 0)
    const airiThisMonth = thisMonth
      .filter((s) => s.profiles?.display_name === 'あいり')
      .reduce((sum, s) => sum + s.amount, 0)

    // 全期間の合計
    const grandTotal = savings.reduce((sum, s) => sum + s.amount, 0)

    // 月数を算出（最初の記録から現在まで）
    const months = new Set(savings.map((s) => s.recorded_date.slice(0, 7)))
    const monthCount = Math.max(months.size, 1)
    const monthlyAvg = Math.round(grandTotal / monthCount)

    // 目標達成までに必要な月額
    const remaining = Math.max(GOAL_AMOUNT - grandTotal, 0)
    // 6ヶ月以内に達成するための月額を表示
    const neededPerMonth = remaining > 0 ? Math.ceil(remaining / 6) : 0

    // 進捗率（パーセント）
    const progressPercent = Math.min(Math.round((grandTotal / GOAL_AMOUNT) * 100), 100)

    return {
      thisMonthTotal,
      shingoThisMonth,
      airiThisMonth,
      grandTotal,
      monthlyAvg,
      remaining,
      neededPerMonth,
      progressPercent,
    }
  }, [savings])

  return (
    <div className="space-y-4">
      {/* メイン進捗カード */}
      <div className="bg-bg-card rounded-2xl p-5 shadow-sm border border-primary-light/30">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-text-sub">貯金の合計</p>
          <span className="text-xs bg-primary-light/40 text-primary px-2 py-0.5 rounded-full font-medium">
            {summary.progressPercent}%
          </span>
        </div>
        <p className="text-3xl font-bold text-text font-[family-name:var(--font-dm-sans)] tracking-tight">
          {summary.grandTotal.toLocaleString()}
          <span className="text-base font-normal text-text-sub ml-1">円</span>
        </p>
        {/* プログレスバー */}
        <div className="mt-3 h-2.5 bg-primary-light/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${summary.progressPercent}%`,
              background: 'linear-gradient(90deg, #B8A9E8, #FFB5C2)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-text-sub">0円</span>
          <span className="text-xs text-success font-medium">目標 100万円</span>
        </div>
      </div>

      {/* サブカード群 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 今月の合計 */}
        <div className="bg-bg-card rounded-xl p-4 shadow-sm border border-primary-light/20">
          <p className="text-xs text-text-sub mb-1">今月の貯金</p>
          <p className="text-xl font-bold text-text font-[family-name:var(--font-dm-sans)]">
            {summary.thisMonthTotal.toLocaleString()}
            <span className="text-xs font-normal text-text-sub ml-0.5">円</span>
          </p>
          <div className="flex gap-3 mt-2">
            <span className="text-xs text-primary">
              しんご {summary.shingoThisMonth.toLocaleString()}円
            </span>
            <span className="text-xs text-accent">
              あいり {summary.airiThisMonth.toLocaleString()}円
            </span>
          </div>
        </div>

        {/* 月平均 */}
        <div className="bg-bg-card rounded-xl p-4 shadow-sm border border-primary-light/20">
          <p className="text-xs text-text-sub mb-1">月平均</p>
          <p className="text-xl font-bold text-text font-[family-name:var(--font-dm-sans)]">
            {summary.monthlyAvg.toLocaleString()}
            <span className="text-xs font-normal text-text-sub ml-0.5">円</span>
          </p>
          {summary.remaining > 0 && (
            <p className="text-xs text-text-sub mt-2">
              あと<span className="font-medium text-accent-warm"> {summary.remaining.toLocaleString()}円</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
