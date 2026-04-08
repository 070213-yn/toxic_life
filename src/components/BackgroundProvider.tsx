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

    // まずlocalStorageから即座に読む（どのキーでも）
    let foundCache = false
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('toxic-life-bg-')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key) || '')
          if (parsed.url) { setBgUrl(parsed.url); foundCache = true; break }
        } catch {}
      }
    }

    // キャッシュがなければDBから取得（初回のみ）
    if (!foundCache) {
      const fetchBg = async () => {
        try {
          const { supabase } = await import('@/lib/supabase/client')
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase
              .from('settings')
              .select('value')
              .eq('key', `background_${user.id}`)
              .single()
            if (data?.value) {
              const val = data.value as { url?: string }
              if (val.url) {
                setBgUrl(val.url)
                localStorage.setItem(`toxic-life-bg-${user.id}`, JSON.stringify(data.value))
              }
            }
          }
        } catch {}
      }
      fetchBg()
    }

    // SettingsPanelからの変更イベント
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
