import { createClient } from '@/lib/supabase/server'
import QuestsPageClient from '@/components/quests/QuestsPageClient'
import type { Milestone } from '@/lib/types'

// マイルストーン＆タスク管理ページ（サーバーコンポーネント）
// データ取得のみ行い、表示・フィルタリングは QuestsPageClient に委譲
export default async function QuestsPage() {
  const supabase = await createClient()

  // マイルストーン一覧をタスク含めて取得（sort_order順）
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*, tasks(*)')
    .order('sort_order', { ascending: true })

  // 貯金合計を取得（自動達成判定に使用）
  const { data: savingsData } = await supabase
    .from('savings')
    .select('amount')

  const totalSavings = savingsData?.reduce((sum, s) => sum + (s.amount || 0), 0) ?? 0

  // タスクもsort_order順に並び替え
  const sortedMilestones: Milestone[] = (milestones ?? []).map((m) => ({
    ...m,
    tasks: (m.tasks ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    ),
  }))

  return (
    <div className="min-h-screen bg-bg">
      {/* ヘッダー */}
      <div className="px-4 pt-8 pb-2 text-center">
        <h1 className="font-[family-name:var(--font-quicksand)] text-2xl font-bold text-text">
          Quest Board
        </h1>
        <p className="text-text-sub text-sm mt-1">ふたりの冒険の書</p>
      </div>

      {/* クライアントコンポーネント（月セレクター＋マイルストーン一覧） */}
      <QuestsPageClient
        milestones={sortedMilestones}
        totalSavings={totalSavings}
      />
    </div>
  )
}
