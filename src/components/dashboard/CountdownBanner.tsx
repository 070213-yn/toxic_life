'use client'

import { useMemo } from 'react'

type Props = {
  moveInDate: string | null
  frierenDate: string | null
}

// 日付までの残り日数を計算するヘルパー
function calcDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  // 時刻差を日数に変換（切り上げ）
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// 引越し＆フリーレンのカウントダウンバナー
// ダッシュボード上部に表示するコンポーネント
export default function CountdownBanner({ moveInDate, frierenDate }: Props) {
  const moveInDays = useMemo(() => calcDaysLeft(moveInDate), [moveInDate])
  const frierenDays = useMemo(() => calcDaysLeft(frierenDate), [frierenDate])

  // 引越し日が未設定の場合
  if (moveInDays === null) {
    return (
      <div className="w-full rounded-2xl bg-primary-light/60 px-6 py-5 text-center">
        <p className="text-text-sub text-sm">引越し日を設定しましょう</p>
      </div>
    )
  }

  // 期限切れ（引越し日が過去）
  if (moveInDays < 0) {
    return (
      <div className="w-full rounded-2xl bg-accent/20 px-6 py-5 text-center">
        <p className="text-text text-lg font-bold">
          新生活スタートおめでとう!
        </p>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-primary-light/70 to-accent/30 px-6 py-5 shadow-sm">
      {/* 引越しカウントダウン（メイン） */}
      <div className="text-center">
        <p className="text-text-sub text-xs mb-1">ふたりの引越しまで</p>
        <p className="text-text text-4xl font-extrabold tracking-tight">
          あと{' '}
          <span className="text-primary text-5xl">{moveInDays}</span>{' '}
          日
        </p>
      </div>

      {/* フリーレン3期カウントダウン（サブ） */}
      {frierenDays !== null && frierenDays > 0 && (
        <div className="mt-3 pt-3 border-t border-primary/15 flex items-center justify-center gap-2">
          <span className="text-sm">✨</span>
          <p className="text-text-sub text-sm">
            フリーレン3期まで あと
            <span className="font-bold text-lg text-primary mx-1 tabular-nums">
              {frierenDays}
            </span>
            日
          </p>
        </div>
      )}
    </div>
  )
}
