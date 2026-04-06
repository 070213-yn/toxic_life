'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// localStorageのキー（SettingsPanelと共通）
const BG_CACHE_KEY = 'toxic-life-background'

// 背景画像 + 白オーバーレイを描画するプロバイダー
// 固定position のdivとして描画し、コンテンツの下に配置
export default function BackgroundProvider() {
  const [bgUrl, setBgUrl] = useState<string | null>(null)

  useEffect(() => {
    // bodyの直接スタイルは削除（旧方式のクリーンアップ）
    document.body.style.backgroundImage = ''
    document.body.style.backgroundSize = ''
    document.body.style.backgroundAttachment = ''
    document.body.style.backgroundPosition = ''
    document.body.style.backgroundRepeat = ''

    // 1. localStorageから即座に取得
    const cached = localStorage.getItem(BG_CACHE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setBgUrl(parsed.url || null)
      } catch {
        // パースエラー
      }
    } else {
      setBgUrl('/images/bg-pastel.png')
    }

    // 2. Supabaseから最新設定を同期
    const fetchAndApply = async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'background')
        .single()

      if (data?.value) {
        const val = data.value as { url?: string }
        setBgUrl(val.url || null)
        localStorage.setItem(BG_CACHE_KEY, JSON.stringify(data.value))
      } else if (!cached) {
        setBgUrl('/images/bg-pastel.png')
      }
    }
    fetchAndApply()

    // 3. SettingsPanelからのカスタムイベント
    const handleBgChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { url?: string }
      setBgUrl(detail?.url || null)
    }
    window.addEventListener('background-change', handleBgChange)

    return () => {
      window.removeEventListener('background-change', handleBgChange)
    }
  }, [])

  if (!bgUrl) return null

  return (
    <>
      {/* 背景画像（固定、最背面） */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.4,
        }}
      />
      {/* 白オーバーレイ（文字の可読性を確保） */}
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-white/50"
      />
    </>
  )
}
