'use client'

import { useEffect, useState } from 'react'

const DEFAULT_BG = '/images/bg-pastel.png'

export default function BackgroundProvider() {
  const [bgUrl, setBgUrl] = useState<string>(DEFAULT_BG)

  useEffect(() => {
    // bodyの旧スタイルをクリーンアップ
    document.body.style.backgroundImage = ''
    document.body.style.backgroundSize = ''
    document.body.style.backgroundAttachment = ''
    document.body.style.backgroundPosition = ''
    document.body.style.backgroundRepeat = ''

    // ユーザーIDを取得してユーザーごとのキャッシュを読む
    const loadBg = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client')
        const { data: { user } } = await supabase.auth.getUser()
        const cacheKey = user ? `toxic-life-bg-${user.id}` : 'toxic-life-background'

        // 1. localStorageから即座に取得
        try {
          const cached = localStorage.getItem(cacheKey)
          if (cached) {
            const parsed = JSON.parse(cached)
            if (parsed.url) setBgUrl(parsed.url)
          }
        } catch {}

        // 2. Supabaseから最新設定を同期
        if (user) {
          const bgKey = `background_${user.id}`
          const { data } = await supabase
            .from('settings')
            .select('*')
            .eq('key', bgKey)
            .single()

          if (data?.value) {
            const val = data.value as { url?: string }
            if (val.url) {
              setBgUrl(val.url)
              localStorage.setItem(cacheKey, JSON.stringify(data.value))
            }
          }
        }
      } catch {
        // DB取得失敗はデフォルトのまま
      }
    }
    loadBg()

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
