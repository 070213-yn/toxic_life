'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import confetti from 'canvas-confetti'

// 貯金記録モーダル
// 金額・日付・メモを入力してSupabaseに保存する
export default function AddSavingModal() {
  const { user } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [recordedDate, setRecordedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // モーダルの開閉をdialog要素で制御
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !amount) return

    const numAmount = parseInt(amount, 10)
    if (isNaN(numAmount) || numAmount <= 0) return

    const { error } = await supabase.from('savings').insert({
      user_id: user.id,
      amount: numAmount,
      memo: memo || null,
      recorded_date: recordedDate,
    })

    if (error) {
      alert('保存に失敗しました: ' + error.message)
      return
    }

    // 成功アニメーション（紙吹雪）
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#B8A9E8', '#FFB5C2', '#A8D8B9', '#FFD4A0'],
    })

    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setIsOpen(false)
      setAmount('')
      setMemo('')
      setRecordedDate(new Date().toISOString().split('T')[0])

      // サーバーデータ再取得
      startTransition(() => {
        router.refresh()
      })
    }, 1200)
  }

  const handleClose = () => {
    setIsOpen(false)
    setShowSuccess(false)
  }

  return (
    <>
      {/* トリガーボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          w-full rounded-2xl bg-gradient-to-r from-primary to-accent
          px-6 py-4 text-white font-bold text-lg
          shadow-md hover:shadow-lg hover:-translate-y-0.5
          transition-all duration-300 cursor-pointer
          active:scale-95
        "
      >
        + 貯金を記録する
      </button>

      {/* モーダル本体 */}
      <dialog
        ref={dialogRef}
        onClose={handleClose}
        className="
          w-[90vw] max-w-md rounded-2xl bg-bg-card p-0
          shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm
        "
      >
        {showSuccess ? (
          // 成功表示
          <div className="flex flex-col items-center justify-center p-10 gap-3">
            <div className="text-5xl animate-bounce">🎉</div>
            <p className="text-xl font-bold text-text">記録しました!</p>
            <p className="text-sm text-text-sub">
              &yen;{parseInt(amount, 10).toLocaleString()} を追加
            </p>
          </div>
        ) : (
          // 入力フォーム
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">貯金を記録</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-text-sub hover:text-text transition-colors text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* 金額入力 */}
            <div>
              <label className="block text-sm text-text-sub mb-1.5">
                金額（円）
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="例: 30000"
                required
                min="1"
                className="
                  w-full rounded-xl border border-gray-200 bg-bg
                  px-4 py-3 text-text text-lg font-semibold
                  placeholder:text-text-sub/50
                  focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                  transition-all
                "
              />
            </div>

            {/* 日付入力 */}
            <div>
              <label className="block text-sm text-text-sub mb-1.5">
                日付
              </label>
              <input
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="
                  w-full rounded-xl border border-gray-200 bg-bg
                  px-4 py-3 text-text
                  focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                  transition-all
                "
              />
            </div>

            {/* メモ入力 */}
            <div>
              <label className="block text-sm text-text-sub mb-1.5">
                メモ（任意）
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="例: 3月分のバイト代"
                className="
                  w-full rounded-xl border border-gray-200 bg-bg
                  px-4 py-3 text-text
                  placeholder:text-text-sub/50
                  focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                  transition-all
                "
              />
            </div>

            {/* 保存ボタン */}
            <button
              type="submit"
              disabled={isPending || !amount}
              className="
                w-full rounded-xl bg-primary py-3.5 text-white font-bold
                hover:bg-primary/90 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer active:scale-95
              "
            >
              {isPending ? '保存中...' : '保存する'}
            </button>
          </form>
        )}
      </dialog>
    </>
  )
}
