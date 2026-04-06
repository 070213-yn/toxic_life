// エリア下見ページ（サーバーコンポーネント）
// scouting_areas テーブルから全エリアを取得し、クライアントに渡す
import { createClient } from '@/lib/supabase/server'
import ScoutingPageClient from '@/components/scouting/ScoutingPageClient'
import type { ScoutingArea } from '@/lib/types'

export default async function ScoutingPage() {
  const supabase = await createClient()

  // エリア一覧を取得（写真・評価・コメント結合、訪問日降順）
  const { data: areas } = await supabase
    .from('scouting_areas')
    .select(`
      *,
      scouting_photos (*),
      scouting_ratings (*),
      scouting_comments (*, profiles:user_id (display_name, avatar_emoji))
    `)
    .order('visited_date', { ascending: false, nullsFirst: false })

  return <ScoutingPageClient areas={(areas as ScoutingArea[]) || []} />
}
