'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  totalSavings: number
  shingoSavings: number
  airiSavings: number
  goal?: number
}

// カウントアップアニメーション用フック
function useCountUp(target: number, duration: number = 800) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // イーズアウト曲線
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(target * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return value
}

// 貯金プログレスリング
// 大きな円形SVGで目標達成度を視覚化する
export default function SavingsRing({
  totalSavings,
  shingoSavings,
  airiSavings,
  goal = 1000000,
}: Props) {
  const percentage = Math.min((totalSavings / goal) * 100, 100)
  const displayAmount = useCountUp(totalSavings)
  const displayPercent = useCountUp(Math.round(percentage))

  // SVGの円パラメータ
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // 内訳バーの幅計算
  const shingoPercent = goal > 0 ? (shingoSavings / goal) * 100 : 0
  const airiPercent = goal > 0 ? (airiSavings / goal) * 100 : 0

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-bg-card p-6 shadow-sm">
      {/* プログレスリング */}
      <div className="relative w-48 h-48">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 200 200"
        >
          {/* 背景の円 */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--primary-light)"
            strokeWidth="14"
            opacity="0.4"
          />
          {/* プログレスの円 */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-[800ms] ease-out"
          />
        </svg>
        {/* 中央のテキスト */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-text">
            {displayPercent}%
          </span>
          <span className="text-xs text-text-sub mt-1">達成</span>
        </div>
      </div>

      {/* 貯金額表示 */}
      <div className="text-center">
        <p className="text-3xl font-extrabold text-text">
          &yen;{displayAmount.toLocaleString()}
        </p>
        <p className="text-sm text-text-sub mt-1">
          / &yen;{goal.toLocaleString()} 目標
        </p>
      </div>

      {/* 内訳バー */}
      <div className="w-full space-y-2">
        <div className="flex justify-between text-xs text-text-sub">
          <span>しんご</span>
          <span>あいり</span>
        </div>
        <div className="h-3 w-full rounded-full bg-primary-light/30 overflow-hidden flex">
          {/* しんごの分 */}
          <div
            className="h-full bg-primary rounded-l-full transition-all duration-700 ease-out"
            style={{ width: `${shingoPercent}%` }}
          />
          {/* あいりの分 */}
          <div
            className="h-full bg-accent rounded-r-full transition-all duration-700 ease-out"
            style={{ width: `${airiPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-primary font-semibold">
            &yen;{shingoSavings.toLocaleString()}
          </span>
          <span className="text-accent font-semibold">
            &yen;{airiSavings.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
