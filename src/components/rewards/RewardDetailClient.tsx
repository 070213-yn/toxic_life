'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { supabase } from '@/lib/supabase/client'
import type { Reward } from '@/lib/types'

type Props = {
  reward: Reward
  milestone: { id: string; title: string; subtitle: string | null; is_completed: boolean } | null
  isCreator: boolean
  shouldReveal: boolean // 秘密のご褒美の初回開封アニメーション
}

// パステルカラー（紙吹雪用）
const CONFETTI_COLORS = ['#B8A9E8', '#FFB5C2', '#FFD4A0', '#A8D8B9', '#E8E0FF']

// ご褒美詳細クライアントコンポーネント
// 通常表示 or 秘密のご褒美開封アニメーション
export function RewardDetailClient({ reward, milestone, isCreator, shouldReveal }: Props) {
  const router = useRouter()
  const [revealed, setRevealed] = useState(!shouldReveal)
  const [showContent, setShowContent] = useState(!shouldReveal)
  const [boxOpening, setBoxOpening] = useState(false)

  // 秘密のご褒美を開封する処理
  const handleReveal = useCallback(async () => {
    setBoxOpening(true)

    // 紙吹雪アニメーション（左側から）
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.1, y: 0.6 },
      colors: CONFETTI_COLORS,
    })

    // 紙吹雪（右側から）
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.9, y: 0.6 },
      colors: CONFETTI_COLORS,
    })

    // 紙吹雪（中央から大量）
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: CONFETTI_COLORS,
      gravity: 0.8,
      ticks: 300,
    })

    // 繰り返し発射（1秒後と2秒後）
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { x: 0.2, y: 0.5 },
        colors: CONFETTI_COLORS,
      })
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { x: 0.8, y: 0.5 },
        colors: CONFETTI_COLORS,
      })
    }, 1000)

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { x: 0.5, y: 0.5 },
        colors: CONFETTI_COLORS,
        gravity: 0.6,
        ticks: 250,
      })
    }, 2000)

    // DBで is_revealed を更新
    await supabase
      .from('rewards')
      .update({ is_revealed: true, revealed_at: new Date().toISOString() })
      .eq('id', reward.id)

    // 1.5秒後に内容を表示
    setTimeout(() => {
      setRevealed(true)
      setTimeout(() => setShowContent(true), 100)
    }, 1500)
  }, [reward.id])

  // 通常のご褒美もページ表示時に軽く紙吹雪
  useEffect(() => {
    if (!shouldReveal && !reward.is_secret) {
      const timer = setTimeout(() => {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { x: 0.5, y: 0.3 },
          colors: CONFETTI_COLORS,
          gravity: 1,
          ticks: 120,
        })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [shouldReveal, reward.is_secret])

  // Supabase Storageの画像URLを取得
  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('scouting-photos').getPublicUrl(path)
    return data.publicUrl
  }

  // 開封前UI（秘密のご褒美）
  if (!revealed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          {/* プレゼントボックス */}
          <div
            className={`inline-block transition-all duration-700 ease-out ${
              boxOpening
                ? 'scale-125 rotate-12 opacity-0'
                : 'scale-100 rotate-0 opacity-100 animate-bounce-gentle'
            }`}
          >
            <div className="relative">
              {/* キラキラ装飾 */}
              <div className="absolute -top-4 -left-4 text-2xl animate-pulse">✨</div>
              <div className="absolute -top-2 -right-6 text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>✨</div>
              <div className="absolute -bottom-2 -left-6 text-lg animate-pulse" style={{ animationDelay: '1s' }}>✨</div>

              {/* プレゼントボックスアイコン */}
              <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 flex items-center justify-center shadow-lg">
                <span className="text-7xl">🎁</span>
              </div>
            </div>
          </div>

          {/* タップして開封ボタン */}
          {!boxOpening && (
            <div className="mt-8" style={{ animation: 'fade-slide-up 0.5s ease-out 0.3s both' }}>
              <p className="text-sm text-purple-400 mb-3">秘密のご褒美が届いています！</p>
              <button
                onClick={handleReveal}
                className="px-8 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
              >
                タップして開封！
              </button>
              {reward.profiles && (
                <p className="text-xs text-text-sub/60 mt-4">
                  {reward.profiles.avatar_emoji} {reward.profiles.display_name} より
                </p>
              )}
            </div>
          )}

          {/* 開封中のメッセージ */}
          {boxOpening && !revealed && (
            <div className="mt-8" style={{ animation: 'fade-slide-up 0.5s ease-out' }}>
              <p className="text-lg font-bold text-purple-500 animate-pulse">
                開封中...
              </p>
            </div>
          )}
        </div>

        {/* バウンスアニメーション用CSS */}
        <style jsx>{`
          @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          .animate-bounce-gentle {
            animation: bounce-gentle 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    )
  }

  // 通常表示（公開済み or 通常ご褒美）
  return (
    <div
      className={`px-4 pt-6 pb-28 max-w-lg mx-auto transition-opacity duration-500 ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 戻るボタン */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-text-sub hover:text-primary transition-colors mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        戻る
      </button>

      {/* マイルストーン情報 */}
      {milestone && (
        <div className="mb-4">
          <span className="text-xs text-text-sub/60">
            {milestone.subtitle ? `${milestone.subtitle} ` : ''}{milestone.title}
          </span>
        </div>
      )}

      {/* お祝いヘッダー */}
      <div className="relative rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200/50 p-6 mb-6 overflow-hidden">
        {/* キラキラ装飾 */}
        <div className="absolute top-3 right-4 text-xl opacity-60">🎉</div>
        <div className="absolute bottom-3 left-4 text-lg opacity-40">✨</div>
        <div className="absolute top-1/2 right-8 text-sm opacity-30">🎊</div>

        {/* 秘密ご褒美バッジ */}
        {reward.is_secret && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-medium mb-3">
            <span>🔮</span>
            秘密のご褒美
          </div>
        )}

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-text leading-snug">
          {reward.title}
        </h1>

        {/* 説明 */}
        {reward.description && (
          <p className="text-sm text-text-sub mt-2 leading-relaxed">
            {reward.description}
          </p>
        )}
      </div>

      {/* 画像 */}
      {reward.image_path && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-primary-light/20 shadow-sm">
          <img
            src={getImageUrl(reward.image_path)}
            alt={reward.title}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {/* お祝いメッセージ（吹き出し風） */}
      {reward.message && (
        <div className="mb-6">
          <div className="relative bg-white rounded-2xl border border-pink-200/50 p-4 shadow-sm">
            {/* 吹き出しの三角 */}
            <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-r border-b border-pink-200/50 transform rotate-45" />
            <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
              {reward.message}
            </p>
          </div>
          {/* 作成者表示 */}
          {reward.profiles && (
            <div className="flex items-center gap-2 mt-3 ml-2">
              <span className="text-lg">{reward.profiles.avatar_emoji}</span>
              <span className="text-xs text-text-sub">{reward.profiles.display_name}</span>
            </div>
          )}
        </div>
      )}

      {/* 予定日 */}
      {reward.planned_date && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-accent-warm/10 border border-accent-warm/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-warm shrink-0">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          <span className="text-sm text-text">
            予定日: {new Date(reward.planned_date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      )}

      {/* URLリンク */}
      {reward.url && (
        <div className="mb-4">
          <a
            href={reward.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            ご褒美を開く
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" x2="21" y1="14" y2="3" />
            </svg>
          </a>
        </div>
      )}

      {/* 作成者（メッセージがない場合のみ表示） */}
      {!reward.message && reward.profiles && (
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-text-sub/10">
          <span className="text-lg">{reward.profiles.avatar_emoji}</span>
          <span className="text-sm text-text-sub">{reward.profiles.display_name} が作成</span>
        </div>
      )}
    </div>
  )
}
