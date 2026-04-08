import { createClient } from '@/lib/supabase/server'
import QuestsPage from '@/components/quests/QuestsPage'
import type { Milestone, Profile, Reward } from '@/lib/types'

// タスクページ（サーバーコンポーネント）
// データ取得のみ行い、表示は QuestsPage クライアントコンポーネントに委譲
export default async function QuestsPageServer() {
  const supabase = await createClient()

  // マイルストーン一覧をタスク含めて取得（sort_order順）
  const { data: milestones, error: msError } = await supabase
    .from('milestones')
    .select('*, tasks(*)')
    .order('sort_order', { ascending: true })

  // 貯金合計を取得（貯金連動タスクの自動判定に使用）
  const { data: savingsData } = await supabase
    .from('savings')
    .select('amount')

  // プロフィール一覧を取得（担当者のアバター表示に使用）
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')

  // ご褒美一覧を取得（マイルストーンごとに振り分ける）
  const { data: rewardsData } = await supabase
    .from('rewards')
    .select('*, profiles:created_by(display_name, avatar_emoji)')
    .order('created_at', { ascending: true })

  const profiles: Profile[] = profilesData ?? []

  // マイルストーンIDごとにご褒美をグループ化
  const rewardsByMilestone: Record<string, Reward[]> = {}
  for (const reward of (rewardsData ?? []) as Reward[]) {
    if (!rewardsByMilestone[reward.milestone_id]) {
      rewardsByMilestone[reward.milestone_id] = []
    }
    rewardsByMilestone[reward.milestone_id].push(reward)
  }

  const totalSavings = savingsData?.reduce((sum, s) => sum + (s.amount || 0), 0) ?? 0

  // タスクもsort_order順に並び替え
  const sortedMilestones: Milestone[] = (milestones ?? []).map((m) => ({
    ...m,
    tasks: (m.tasks ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    ),
  }))

  // データ取得失敗時のフォールバック
  if (msError && !milestones) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-bg-card rounded-2xl p-8 shadow-sm border border-primary-light/30 text-center max-w-sm">
          <svg className="w-12 h-12 mx-auto mb-4 text-text-sub/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-text-sub text-sm">データの読み込みに失敗しました</p>
          <p className="text-text-sub/60 text-xs mt-1">ページをリロードしてみてね</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <div className="px-4 pt-8 pb-4 text-center">
        <h1 className="font-[family-name:var(--font-quicksand)] text-2xl font-bold text-text">
          Task Board
        </h1>
      </div>

      {/* クライアントコンポーネント（サマリー＋マイルストーン一覧） */}
      <QuestsPage
        milestones={sortedMilestones}
        totalSavings={totalSavings}
        profiles={profiles}
        rewardsByMilestone={rewardsByMilestone}
      />
    </div>
  )
}
