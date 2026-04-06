'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

// localStorageのキー（SettingsPanelと共通）
const BG_CACHE_KEY = 'toxic-life-background'

// 背景画像を適用するプロバイダー
// settingsテーブルから背景設定を取得し、document.bodyに適用する
// localStorageでキャッシュして即時反映を実現
export default function BackgroundProvider() {
  // 背景をbodyに適用する関数
  const applyBackground = (url: string | null) => {
    if (url) {
      document.body.style.backgroundImage = `url(${url})`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundAttachment = 'fixed'
      document.body.style.backgroundPosition = 'center'
      document.body.style.backgroundRepeat = 'no-repeat'
    } else {
      document.body.style.backgroundImage = ''
      document.body.style.backgroundSize = ''
      document.body.style.backgroundAttachment = ''
      document.body.style.backgroundPosition = ''
      document.body.style.backgroundRepeat = ''
    }
  }

  useEffect(() => {
    // 1. まずlocalStorageから即座に適用（ちらつき防止）
    const cached = localStorage.getItem(BG_CACHE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        applyBackground(parsed.url || null)
      } catch {
        // パースエラーの場合は無視
      }
    } else {
      // キャッシュがない場合、デフォルト背景を適用
      applyBackground('/images/bg-pastel.png')
    }

    // 2. Supabaseから最新の設定を取得して同期
    const fetchAndApply = async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'background')
        .single()

      if (data?.value) {
        const val = data.value as { url?: string }
        applyBackground(val.url || null)
        localStorage.setItem(BG_CACHE_KEY, JSON.stringify(data.value))
      } else if (!cached) {
        // DB設定もキャッシュもない場合はデフォルト背景
        applyBackground('/images/bg-pastel.png')
      }
    }
    fetchAndApply()

    // 3. SettingsPanelからのカスタムイベントをリスン（即時反映）
    const handleBgChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { url?: string }
      applyBackground(detail?.url || null)
    }
    window.addEventListener('background-change', handleBgChange)

    // クリーンアップ
    return () => {
      window.removeEventListener('background-change', handleBgChange)
      // bodyのスタイルはリセットしない（他ページでも継続）
    }
  }, [])

  // UIを持たないプロバイダー
  return null
}
