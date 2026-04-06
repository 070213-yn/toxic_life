// エリア詳細ページ（サーバーコンポーネント）
// パスパラメータからIDを取得し、エリア情報を結合取得してクライアントに渡す
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AreaDetailClient from '@/components/scouting/AreaDetailClient'
import type { ScoutingArea } from '@/lib/types'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AreaDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // エリア情報を結合取得（ratingsにもprofilesを結合）
  const { data: area, error } = await supabase
    .from('scouting_areas')
    .select(`
      *,
      scouting_photos (*),
      scouting_ratings (*, profiles:user_id (id, display_name, avatar_emoji)),
      scouting_comments (*, profiles:user_id (id, display_name, avatar_emoji))
    `)
    .eq('id', id)
    .single()

  if (error || !area) {
    notFound()
  }

  return <AreaDetailClient area={area as ScoutingArea} />
}
