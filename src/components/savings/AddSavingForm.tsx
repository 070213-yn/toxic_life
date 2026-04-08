'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { notifyDiscord } from '@/lib/discord'
import confetti from 'canvas-confetti'

// 貯金記録の追加フォーム
// 金額・日付・メモを入力して保存する。user_idは認証情報から自動セット
// 保存成功時にconfetti演出と成功メッセージを表示
export function AddSavingForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { user, profile } = useAuth()

  // 今日の日付をデフォルト値に
  const today = new Date().toISOString().split('T')[0]

  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [recordedDate, setRecordedDate] = useState(today)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // 小さなconfetti演出を発射
  const fireConfetti = useCallback(() => {
    // パステルカラーのconfetti（アプリのテーマに合わせて）
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#B8A9E8', '#FFB5C2', '#A8D8B9', '#FFD6A0', '#E8E0FF'],
      scalar: 0.8,
      gravity: 1.2,
      ticks: 150,
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!user) {
      setError('ログインが必要です')
      return
    }

    const numAmount = parseInt(amount.replace(/,/g, ''), 10)
    if (!numAmount || numAmount <= 0) {
      setError('金額を入力してください')
      return
    }

    setSaving(true)

    const { error: insertError } = await supabase.from('savings').insert({
      user_id: user.id,
      amount: numAmount,
      memo: memo.trim() || null,
      recorded_date: recordedDate,
    })

    if (insertError) {
      setError('保存に失敗しました。もう一度お試しください')
      setSaving(false)
      return
    }

    // 保存成功 → confetti演出 & 成功メッセージ表示
    fireConfetti()
    setSuccessMessage('貯金を記録したよ！')

    // Discord通知（fire and forget）
    const displayName = profile?.display_name || 'だれか'
    notifyDiscord(`💰 ${displayName}が ¥${numAmount.toLocaleString()} を貯金しました！\n[貯金を見る →](https://toxiclife.vercel.app/savings)`)
    setSaving(false)

    // フォームをリセット
    setAmount('')
    setMemo('')
    setRecordedDate(today)

    // ページデータを再取得
    router.refresh()

    // 3秒後にメッセージを消してフォームを閉じる
    setTimeout(() => {
      setSuccessMessage('')
      onClose()
    }, 3000)
  }

  // 金額入力時にカンマ区切りで表示
  const handleAmountChange = (value: string) => {
    const num = value.replace(/[^0-9]/g, '')
    if (num) {
      setAmount(parseInt(num, 10).toLocaleString())
    } else {
      setAmount('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-bg-card rounded-2xl p-5 shadow-md border border-primary-light/30 relative overflow-hidden"
    >
      <h3 className="text-base font-bold text-text mb-4">貯金を記録する</h3>

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-4 px-4 py-3 bg-success/15 border border-success/30 rounded-xl text-center animate-[slideDown_0.3s_ease-out]">
          <p className="text-sm font-medium text-success">{successMessage}</p>
        </div>
      )}

      {/* 金額入力 */}
      <div className="mb-4">
        <label htmlFor="amount" className="block text-xs text-text-sub mb-1.5">
          金額
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub text-sm">
            ¥
          </span>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="10,000"
            className="w-full pl-8 pr-4 py-3 bg-bg rounded-xl border border-primary-light/40
                       text-2xl font-bold text-text font-[family-name:var(--font-dm-sans)]
                       placeholder:text-text-sub/30 placeholder:font-normal placeholder:text-lg
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                       transition-all"
            autoFocus
          />
        </div>
      </div>

      {/* 日付入力 */}
      <div className="mb-4">
        <label htmlFor="date" className="block text-xs text-text-sub mb-1.5">
          日付
        </label>
        <input
          id="date"
          type="date"
          value={recordedDate}
          onChange={(e) => setRecordedDate(e.target.value)}
          className="w-full px-4 py-2.5 bg-bg rounded-xl border border-primary-light/40
                     text-sm text-text
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                     transition-all"
        />
      </div>

      {/* メモ入力 */}
      <div className="mb-5">
        <label htmlFor="memo" className="block text-xs text-text-sub mb-1.5">
          メモ（任意）
        </label>
        <input
          id="memo"
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="例: 今月の残業代から"
          className="w-full px-4 py-2.5 bg-bg rounded-xl border border-primary-light/40
                     text-sm text-text placeholder:text-text-sub/40
                     focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                     transition-all"
        />
      </div>

      {/* エラー表示 */}
      {error && (
        <p className="text-xs text-red-400 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* ボタン群 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 text-sm text-text-sub bg-bg rounded-xl
                     border border-primary-light/30
                     hover:bg-primary-light/20 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving || !amount}
          className="flex-1 py-2.5 text-sm font-medium text-white bg-primary rounded-xl
                     shadow-md shadow-primary/25
                     hover:shadow-lg hover:shadow-primary/30
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all"
        >
          {saving ? '保存中...' : '保存する'}
        </button>
      </div>
    </form>
  )
}
