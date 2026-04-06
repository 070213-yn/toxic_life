'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Saving } from '@/lib/types'

const GOAL_AMOUNT = 1000000 // 目標: 100万円

// 金額を「万円」表示にフォーマット
function formatYen(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}万`
  }
  return `${value.toLocaleString()}`
}

// 月別の貯金データを集計し、累計を算出する
function aggregateByMonth(savings: Saving[]) {
  // 月ごとに「しんご」「あいり」を集計
  const monthMap = new Map<string, { shingo: number; airi: number }>()

  for (const s of savings) {
    const month = s.recorded_date.slice(0, 7) // "YYYY-MM"
    const name = s.profiles?.display_name ?? ''
    const current = monthMap.get(month) ?? { shingo: 0, airi: 0 }

    if (name === 'しんご') {
      current.shingo += s.amount
    } else if (name === 'あいり') {
      current.airi += s.amount
    }

    monthMap.set(month, current)
  }

  // 月を古い順にソート
  const sortedMonths = Array.from(monthMap.entries()).sort(
    ([a], [b]) => a.localeCompare(b)
  )

  // 累計を算出
  let cumShingo = 0
  let cumAiri = 0

  return sortedMonths.map(([month, { shingo, airi }]) => {
    cumShingo += shingo
    cumAiri += airi
    // 月表示を短縮（例: "2026-04" → "4月"）
    const m = parseInt(month.split('-')[1], 10)
    return {
      month: `${m}月`,
      fullMonth: month,
      しんご: cumShingo,
      あいり: cumAiri,
      合計: cumShingo + cumAiri,
    }
  })
}

// 現在のペースで目標に到達する月を予測
function predictGoalDate(data: { fullMonth: string; 合計: number }[]) {
  if (data.length < 2) return null

  const latest = data[data.length - 1]
  const first = data[0]
  const totalMonths = data.length
  const monthlyAvg = latest.合計 / totalMonths

  if (monthlyAvg <= 0) return null
  if (latest.合計 >= GOAL_AMOUNT) return '達成済み!'

  const remainingMonths = Math.ceil((GOAL_AMOUNT - latest.合計) / monthlyAvg)
  const lastDate = new Date(latest.fullMonth + '-01')
  lastDate.setMonth(lastDate.getMonth() + remainingMonths)

  return `${lastDate.getFullYear()}年${lastDate.getMonth() + 1}月頃`
}

// カスタムツールチップ
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-bg-card rounded-xl shadow-lg border border-primary-light/50 p-3 text-sm">
      <p className="font-medium text-text mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {entry.value.toLocaleString()}円
        </p>
      ))}
    </div>
  )
}

// 月別貯金推移エリアチャート
export function SavingsChart({ savings }: { savings: Saving[] }) {
  const chartData = useMemo(() => aggregateByMonth(savings), [savings])
  const prediction = useMemo(() => predictGoalDate(chartData), [chartData])

  if (chartData.length === 0) {
    return (
      <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-primary-light/30">
        <h2 className="text-lg font-bold text-text mb-2">貯金推移</h2>
        <p className="text-text-sub text-sm">
          記録を追加すると、ここにグラフが表示されます
        </p>
      </div>
    )
  }

  return (
    <div className="bg-bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-primary-light/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text">貯金推移</h2>
        {prediction && (
          <p className="text-xs text-text-sub bg-primary-light/40 px-3 py-1 rounded-full">
            このペースで <span className="font-bold text-primary">{prediction}</span> に達成
          </p>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            {/* しんご用グラデーション */}
            <linearGradient id="gradShingo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#B8A9E8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#B8A9E8" stopOpacity={0} />
            </linearGradient>
            {/* あいり用グラデーション */}
            <linearGradient id="gradAiri" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB5C2" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FFB5C2" stopOpacity={0} />
            </linearGradient>
            {/* 合計用グラデーション */}
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4A4458" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#4A4458" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#E8E0FF" opacity={0.5} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#9490A5' }}
            axisLine={{ stroke: '#E8E0FF' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYen}
            tick={{ fontSize: 11, fill: '#9490A5' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
          />

          {/* 目標ライン: 100万円 */}
          <ReferenceLine
            y={GOAL_AMOUNT}
            stroke="#A8D8B9"
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              value: '目標 100万円',
              position: 'insideTopRight',
              fill: '#A8D8B9',
              fontSize: 11,
            }}
          />

          {/* しんごの累計 */}
          <Area
            type="monotone"
            dataKey="しんご"
            stroke="#B8A9E8"
            strokeWidth={2}
            fill="url(#gradShingo)"
            dot={{ r: 3, fill: '#B8A9E8' }}
            activeDot={{ r: 5 }}
          />
          {/* あいりの累計 */}
          <Area
            type="monotone"
            dataKey="あいり"
            stroke="#FFB5C2"
            strokeWidth={2}
            fill="url(#gradAiri)"
            dot={{ r: 3, fill: '#FFB5C2' }}
            activeDot={{ r: 5 }}
          />
          {/* 合計 */}
          <Area
            type="monotone"
            dataKey="合計"
            stroke="#4A4458"
            strokeWidth={2}
            fill="url(#gradTotal)"
            dot={{ r: 3, fill: '#4A4458' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
