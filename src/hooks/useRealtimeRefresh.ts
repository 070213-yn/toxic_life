'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

/**
 * 指定したテーブルの変更をSupabase Realtimeで監視し、
 * 変更があったらページデータを再取得（router.refresh）するフック。
 *
 * 注意: Supabaseダッシュボードで各テーブルのReplication（リアルタイム配信）を
 * 有効にする必要があります。
 * Database > Replication > 対象テーブルを有効化
 *
 * @param tables - 監視対象のテーブル名の配列（コンポーネント外で定数定義推奨）
 */
export function useRealtimeRefresh(tables: string[]) {
  const router = useRouter()
  // デバウンス用のタイマーを保持
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const channel = supabase.channel('realtime-refresh')

    // 各テーブルの変更を監視
    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE すべて監視
          schema: 'public',
          table,
        },
        () => {
          // 500msのデバウンス: 短時間に大量の変更が来てもrefreshは1回だけ
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            router.refresh()
          }, 500)
        }
      )
    })

    channel.subscribe()

    // クリーンアップ: チャンネル解除とタイマークリア
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      channel.unsubscribe()
    }
  }, [tables, router])
}
