'use client'

import { useEffect, useState } from 'react'

const BG_CACHE_KEY = 'toxic-life-background'
const DEFAULT_BG = '/images/bg-pastel.png'

export default function BackgroundProvider() {
  // デフォルト背景を初期値にして、即座に表示
  const [bgUrl, setBgUrl] = useState<string>(DEFAULT_BG)

  useEffect(() => {
    // bodyの旧スタイルをクリーンアップ
    document.body.style.backgroundImage = ''
    document.body.style.backgroundSize = ''
    document.body.style.backgroundAttachment = ''
    document.body.style.backgroundPosition = ''
    document.body.style.backgroundRepeat = ''

    // 1. localStorageから取得（あれば上書き）
    try {
      const cached = localStorage.getItem(BG_CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.url) setBgUrl(parsed.url)
      }
    } catch {
      // パースエラーは無視
    }

    // 2. Supabaseから最新設定を同期（ログイン前は失敗するが問題ない）
    const fetchBg = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'background')
          .single()

        if (data?.value) {
          const val = data.value as { url?: string }
          if (val.url) {
            setBgUrl(val.url)
            localStorage.setItem(BG_CACHE_KEY, JSON.stringify(data.value))
          }
        }
      } catch {
        // DB取得失敗はデフォルト背景のまま
      }
    }
    fetchBg()

    // 3. SettingsPanelからの変更イベント
    const handleBgChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { url?: string }
      setBgUrl(detail?.url || DEFAULT_BG)
    }
    window.addEventListener('background-change', handleBgChange)
    return () => window.removeEventListener('background-change', handleBgChange)
  }, [])

  return (
    <>
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
      <div className="fixed inset-0 z-0 pointer-events-none bg-white/50" />
    </>
  )
}
