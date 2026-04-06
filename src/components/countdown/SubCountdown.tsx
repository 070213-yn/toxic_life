'use client'

import { useEffect, useState } from 'react'

// フリーレン3期までのサブカウントダウン
// メインより控えめなサイズで表示
export function SubCountdown({ targetDate }: { targetDate: string }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return 0
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    setDaysLeft(calc())
    // 1分ごとに更新（秒単位は不要）
    const interval = setInterval(() => setDaysLeft(calc()), 60000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (daysLeft === null) return null

  return (
    <div className="bg-bg-card/60 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-sm border border-primary/10">
      <div className="flex items-center gap-3">
        <span className="text-lg">&#x2728;</span>
        <p className="text-sm" style={{ color: 'var(--countdown-text-sub, var(--text-sub))' }}>
          フリーレン3期まで あと
          <span className="font-[family-name:var(--font-dm-sans)] font-bold text-xl mx-1.5 tabular-nums" style={{ color: 'var(--countdown-primary, var(--primary))' }}>
            {daysLeft}
          </span>
          日
        </p>
      </div>
    </div>
  )
}
