'use client'

import { useEffect, useState } from 'react'

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// 残り時間を計算するユーティリティ
function calcTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

// メインカウントダウン表示コンポーネント
// 引越し日までのリアルタイムカウントダウンを大きな数字で表示
export function CountdownDisplay({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 初回計算
    setTimeLeft(calcTimeLeft(targetDate))

    // 毎秒更新
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  // ハイドレーション不一致を防ぐため、マウント前はプレースホルダー
  if (!mounted || !targetDate) {
    return (
      <div className="text-center">
        <p className="text-text-sub text-sm tracking-widest uppercase mb-4">
          引越しまで
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-[family-name:var(--font-dm-sans)] text-7xl md:text-9xl font-bold text-primary/30">
            --
          </span>
        </div>
      </div>
    )
  }

  const isPast = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  return (
    <div className="text-center">
      {/* ラベル */}
      <p className="text-text-sub text-sm tracking-[0.3em] uppercase mb-6">
        {isPast ? '新生活スタート！' : '引越しまで'}
      </p>

      {isPast ? (
        // 引越し日を過ぎた場合
        <div className="space-y-2">
          <p className="font-[family-name:var(--font-dm-sans)] text-6xl md:text-8xl font-bold text-success">
            0
          </p>
          <p className="text-text-sub text-lg">おめでとう！新生活の始まりだね</p>
        </div>
      ) : (
        // カウントダウン表示
        <div className="flex items-end justify-center gap-3 md:gap-6">
          <TimeUnit value={timeLeft.days} label="日" large />
          <Separator />
          <TimeUnit value={timeLeft.hours} label="時間" />
          <Separator />
          <TimeUnit value={timeLeft.minutes} label="分" />
          <Separator />
          <TimeUnit value={timeLeft.seconds} label="秒" />
        </div>
      )}

      {/* 目標日表示 */}
      {targetDate && (
        <p className="mt-6 text-text-sub text-xs tracking-wider">
          {new Date(targetDate).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}

// 個別の時間ユニット（日、時間、分、秒）
function TimeUnit({ value, label, large }: { value: number; label: string; large?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-[family-name:var(--font-dm-sans)] font-bold tabular-nums leading-none ${
          large
            ? 'text-6xl md:text-9xl text-primary'
            : 'text-4xl md:text-7xl text-text'
        }`}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-text-sub text-xs md:text-sm mt-2 tracking-wider">
        {label}
      </span>
    </div>
  )
}

// コロン区切り（アニメーション付き）
function Separator() {
  return (
    <span className="font-[family-name:var(--font-dm-sans)] text-3xl md:text-5xl text-primary/40 mb-6 animate-pulse">
      :
    </span>
  )
}
