import { createClient } from '@/lib/supabase/server'
import type { Saving } from '@/lib/types'
import { SavingsPageClient } from '@/components/savings/SavingsPageClient'

// 貯金管理ページ（サーバーコンポーネント）
// Supabaseから貯金記録をプロフィール付きで全件取得し、クライアントに渡す
export default async function SavingsPage() {
  const supabase = await createClient()

  // 貯金記録を日付の新しい順に取得（profilesテーブルを結合）
  const { data: savings, error } = await supabase
    .from('savings')
    .select('*, profiles(*)')
    .order('recorded_date', { ascending: false })

  if (error) {
    console.error('貯金データの取得に失敗:', error)
  }

  return <SavingsPageClient initialSavings={(savings as Saving[]) ?? []} />
}
