// 同棲準備ガイドページ（サーバーコンポーネント）
// guide_itemsをprofiles結合で全件取得し、クライアントに渡す

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import GuidePageClient from '@/components/guide/GuidePageClient'

export const metadata: Metadata = {
  title: '同棲準備ガイド | 卍Toxic Life卍',
}

export default async function GuidePage() {
  const supabase = await createClient()

  // guide_itemsをprofiles付きで取得（sort_order順）
  const { data: items } = await supabase
    .from('guide_items')
    .select('*, profiles:checked_by(id, display_name, avatar_emoji)')
    .order('sort_order', { ascending: true })

  return <GuidePageClient items={items ?? []} />
}
