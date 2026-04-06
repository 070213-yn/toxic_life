'use client'

import { useEffect, useState } from 'react'

// 時間帯に応じた背景グラデーションコンポーネント
// 朝: 暖色系、昼: ラベンダー、夜: 深い紫
export function TimeGradient() {
  const [gradient, setGradient] = useState('')

  useEffect(() => {
    // 現在時刻からグラデーションを決定
    const updateGradient = () => {
      const hour = new Date().getHours()
      let bg: string

      if (hour >= 5 && hour < 10) {
        // 朝（5〜9時）: 暖かいオレンジ〜ピンク
        bg = 'linear-gradient(135deg, #FFF5E6 0%, #FFE0D0 30%, #FFD4E0 60%, #F0E0FF 100%)'
      } else if (hour >= 10 && hour < 16) {
        // 昼（10〜15時）: 明るいラベンダー〜スカイブルー
        bg = 'linear-gradient(135deg, #F0E8FF 0%, #E8E0FF 30%, #E0EEFF 60%, #F5F0FF 100%)'
      } else if (hour >= 16 && hour < 19) {
        // 夕方（16〜18時）: ゴールデンアワー
        bg = 'linear-gradient(135deg, #FFE8D0 0%, #FFD0D8 30%, #E8C0F0 60%, #D0D0FF 100%)'
      } else {
        // 夜（19〜4時）: 深い紫〜ネイビー
        bg = 'linear-gradient(135deg, #2D1B4E 0%, #1E1040 30%, #251545 60%, #1A1030 100%)'
      }

      setGradient(bg)
    }

    updateGradient()
    // 1分ごとに更新（時間帯の切り替わりを反映）
    const interval = setInterval(updateGradient, 60000)
    return () => clearInterval(interval)
  }, [])

  // 夜間（19〜4時）かどうかを判定
  const [isNight, setIsNight] = useState(false)

  useEffect(() => {
    const checkNight = () => {
      const h = new Date().getHours()
      setIsNight(h >= 19 || h < 5)
    }
    checkNight()
    const nightCheck = setInterval(checkNight, 60000)
    return () => clearInterval(nightCheck)
  }, [])

  return (
    <>
      {/* 夜間は親要素にdata属性を設定し、テキスト色を白系に切り替えるCSS変数を上書き */}
      {isNight && (
        <style>{`
          .countdown-container { --countdown-text: #F0EAF8; --countdown-text-sub: #C0B8D8; --countdown-primary: #D4C8F0; }
        `}</style>
      )}
      <div
        className="absolute inset-0 transition-all duration-[3000ms]"
        style={{ background: gradient }}
      >
        {/* 装飾的な光のオーブ */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-accent-warm/10 blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </>
  )
}
