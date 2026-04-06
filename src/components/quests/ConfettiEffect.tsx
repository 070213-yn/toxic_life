'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

// マイルストーン達成時の紙吹雪演出
// canvas-confetti ライブラリを使用
// パステルカラーの紙吹雪を画面中央から打ち上げ
export function ConfettiEffect() {
  useEffect(() => {
    // パステルカラーの紙吹雪を2回発射
    const colors = ['#B8A9E8', '#FFB5C2', '#A8D8B9', '#FFD4A0', '#E8E0FF']

    // 1回目: 左側から
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { x: 0.3, y: 0.6 },
      colors,
      ticks: 150,
      gravity: 1.2,
      scalar: 1.1,
    })

    // 2回目: 右側から（少し遅延）
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { x: 0.7, y: 0.6 },
        colors,
        ticks: 150,
        gravity: 1.2,
        scalar: 1.1,
      })
    }, 200)
  }, [])

  // DOM要素は不要（canvas-confettiが自動でcanvasを管理）
  return null
}
