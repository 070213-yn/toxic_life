'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

/**
 * 指定したテーブルの変更をSupabase Realtimeで監視し、
 * 変更があったら「更新があります」トーストを表示するフック。
 */
export function useRealtimeRefresh(tables: string[]) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showToast, setShowToast] = useState(false)

  const handleReload = useCallback(() => {
    setShowToast(false)
    window.location.reload()
  }, [])

  const dismiss = useCallback(() => {
    setShowToast(false)
  }, [])

  useEffect(() => {
    const channel = supabase.channel(`realtime-${tables.join('-')}`)

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        () => {
          // 自分の操作は各コンポーネント内で楽観的更新済み
          // 相手の操作のみトースト表示
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            setShowToast(true)
          }, 1000)
        }
      )
    })

    channel.subscribe()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      channel.unsubscribe()
    }
  }, [tables])

  return { showToast, handleReload, dismiss }
}
