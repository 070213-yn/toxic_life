import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RewardDetailClient } from '@/components/rewards/RewardDetailClient'
import type { Reward } from '@/lib/types'

// ご褒美詳細ページ（サーバーコンポーネント）
// 秘密のご褒美は作成者以外には条件付きで表示制限
export default async function RewardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 現在のユーザーを取得
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // ご褒美をプロフィール結合で取得
  const { data: reward, error } = await supabase
    .from('rewards')
    .select('*, profiles:created_by(display_name, avatar_emoji)')
    .eq('id', id)
    .single()

  if (error || !reward) {
    notFound()
  }

  // マイルストーン情報を取得
  const { data: milestone } = await supabase
    .from('milestones')
    .select('id, title, subtitle, is_completed')
    .eq('id', reward.milestone_id)
    .single()

  const typedReward = reward as Reward
  const isCreator = user.id === typedReward.created_by
  const isSecret = typedReward.is_secret
  const isRevealed = typedReward.is_revealed
  const milestoneCompleted = milestone?.is_completed ?? false

  // 秘密のご褒美で、作成者でなく、まだ公開されていない場合
  if (isSecret && !isCreator && !isRevealed && !milestoneCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-bg-card rounded-3xl p-8 shadow-sm border border-purple-200 text-center max-w-sm">
          <div className="text-6xl mb-4">🎁</div>
          <h2 className="text-lg font-bold text-text mb-2">秘密のご褒美があります！</h2>
          <p className="text-sm text-text-sub">
            チャプタークリアまでお楽しみに
          </p>
          {milestone && (
            <p className="text-xs text-text-sub/60 mt-4">
              対象: {milestone.subtitle ? `${milestone.subtitle} ` : ''}{milestone.title}
            </p>
          )}
        </div>
      </div>
    )
  }

  // 秘密のご褒美で初めて開封する場合（作成者でない & 開封済みでない）
  const shouldShowRevealAnimation = isSecret && !isCreator && !isRevealed && milestoneCompleted

  return (
    <div className="min-h-screen">
      <RewardDetailClient
        reward={typedReward}
        milestone={milestone}
        isCreator={isCreator}
        shouldReveal={shouldShowRevealAnimation}
      />
    </div>
  )
}
