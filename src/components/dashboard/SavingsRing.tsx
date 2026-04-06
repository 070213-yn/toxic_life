'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

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
  const router = useRouter()
  const percentage = Math.min((totalSavings / goal) * 100, 100)
  const displayAmount = useCountUp(totalSavings)
  const displayPercent = useCountUp(Math.round(percentage))

  // 目標金額の編集状態
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [editGoalValue, setEditGoalValue] = useState(String(goal))
  const [isSavingGoal, setIsSavingGoal] = useState(false)
  const goalInputRef = useRef<HTMLInputElement>(null)

  // 目標金額の編集を開始
  const startEditingGoal = useCallback(() => {
    setEditGoalValue(String(goal))
    setIsEditingGoal(true)
    setTimeout(() => goalInputRef.current?.focus(), 50)
  }, [goal])

  // 目標金額を保存（settingsテーブルにupsert）
  const saveGoal = useCallback(async () => {
    const newAmount = parseInt(editGoalValue.replace(/,/g, ''), 10)
    if (isNaN(newAmount) || newAmount <= 0) {
      alert('有効な金額を入力してください')
      return
    }
    setIsSavingGoal(true)
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: 'savings_goal', value: { amount: newAmount } },
        { onConflict: 'key' }
      )
    setIsSavingGoal(false)
    if (error) {
      alert('保存に失敗しました: ' + error.message)
      return
    }
    setIsEditingGoal(false)
    router.refresh()
  }, [editGoalValue, router])

  // Enterで保存、Escapeでキャンセル
  const handleGoalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      saveGoal()
    }
    if (e.key === 'Escape') {
      setIsEditingGoal(false)
    }
  }, [saveGoal])

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
        {/* 目標金額（クリックで編集可能） */}
        {isEditingGoal ? (
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-sm text-text-sub">/ &yen;</span>
            <input
              ref={goalInputRef}
              type="text"
              inputMode="numeric"
              value={editGoalValue}
              onChange={(e) => setEditGoalValue(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={handleGoalKeyDown}
              disabled={isSavingGoal}
              className="w-28 px-2 py-0.5 text-sm text-center rounded-md border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              onClick={saveGoal}
              disabled={isSavingGoal}
              className="p-0.5 text-primary hover:text-primary/80 disabled:opacity-40"
              title="保存"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              onClick={() => setIsEditingGoal(false)}
              disabled={isSavingGoal}
              className="p-0.5 text-text-sub hover:text-text disabled:opacity-40"
              title="キャンセル"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={startEditingGoal}
            className="text-sm text-text-sub mt-1 hover:text-primary transition-colors cursor-pointer group"
            title="目標金額を変更"
          >
            / &yen;{goal.toLocaleString()} 目標
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
        )}
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
