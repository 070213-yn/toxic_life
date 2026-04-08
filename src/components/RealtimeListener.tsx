'use client'

import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import RealtimeToast from './RealtimeToast'

// 全テーブルを一括監視するグローバルリスナー
const ALL_TABLES = [
  'tasks', 'savings', 'milestones',
  'scouting_areas', 'scouting_photos', 'scouting_ratings', 'scouting_comments',
  'shopping_items', 'shopping_candidates',
  'cooking_records',
]

export default function RealtimeListener() {
  const { showToast, handleReload, dismiss } = useRealtimeRefresh(ALL_TABLES)

  return <RealtimeToast show={showToast} onReload={handleReload} onDismiss={dismiss} />
}
