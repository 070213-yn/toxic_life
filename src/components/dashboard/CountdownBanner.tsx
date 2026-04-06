'use client'

import { useMemo } from 'react'

type Props = {
  moveInDate: string | null
}

// 引越しまでのカウントダウンバナー
// ヘッダー直下に表示する目立つコンポーネント
export default function CountdownBanner({ moveInDate }: Props) {
  const daysLeft = useMemo(() => {
    if (!moveInDate) return null
    const target = new Date(moveInDate)
    const now = new Date()
    // 時刻差を日数に変換（切り上げ）
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [moveInDate])

  if (daysLeft === null) {
    return (
      <div className="w-full rounded-2xl bg-primary-light/60 px-6 py-5 text-center">
        <p className="text-text-sub text-sm">引越し日を設定しましょう</p>
      </div>
    )
  }

  // 期限切れ（過去の日付）
  if (daysLeft < 0) {
    return (
      <div className="w-full rounded-2xl bg-accent/20 px-6 py-5 text-center">
        <p className="text-text text-lg font-bold">
          新生活スタートおめでとう!
        </p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-primary-light/70 to-accent/30 px-6 py-5 text-center shadow-sm">
      <p className="text-text-sub text-xs mb-1">ふたりの引越しまで</p>
      <p className="text-text text-4xl font-extrabold tracking-tight">
        あと{' '}
        <span className="text-primary text-5xl">{daysLeft}</span>{' '}
        日
      </p>
    </div>
  )
}
