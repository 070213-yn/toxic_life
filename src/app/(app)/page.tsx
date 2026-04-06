import { createClient } from '@/lib/supabase/server'
import CountdownBanner from '@/components/dashboard/CountdownBanner'
import SavingsRing from '@/components/dashboard/SavingsRing'
import TodoHighlight from '@/components/dashboard/TodoHighlight'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import type { Milestone, Task, Saving } from '@/lib/types'

// ダッシュボード（トップページ）
// サーバーコンポーネントとしてSupabaseからデータを取得し、
// 各クライアントコンポーネントにpropsで渡す
export default async function DashboardPage() {
  const supabase = await createClient()

  // --- 並列でデータ取得 ---
  const [
    savingsResult,
    milestonesResult,
    moveInResult,
    recentSavingsResult,
    recentTasksResult,
    savingsGoalResult,
  ] = await Promise.all([
    // 貯金データ（ユーザー情報込み）
    supabase
      .from('savings')
      .select('*, profiles(display_name)')
      .order('recorded_date', { ascending: false }),

    // マイルストーン（タスク込み、順番通り）
    supabase
      .from('milestones')
      .select('*, tasks(*)')
      .order('sort_order', { ascending: true }),

    // 引越し日を取得
    supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'move_in_date')
      .single(),

    // 直近の貯金記録（活動フィード用）
    supabase
      .from('savings')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false })
      .limit(5),

    // 直近の完了タスク（活動フィード用）
    supabase
      .from('tasks')
      .select('*')
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(5),

    // 貯金目標額を取得
    supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'savings_goal')
      .single(),
  ])

  const savings: Saving[] = savingsResult.data ?? []
  const milestones: Milestone[] = milestonesResult.data ?? []

  // 引越し日を取得
  // seed.sqlでは value が JSONBの文字列（例: "2027-07-15"）
  // UIからは { date: "2027-07-15" } の形式で保存される
  const moveInRaw = moveInResult.data?.value
  let moveInDate: string | null = null
  if (typeof moveInRaw === 'string') {
    // seed.sql形式: JSONBに文字列が直接入っている
    moveInDate = moveInRaw
  } else if (moveInRaw && typeof moveInRaw === 'object') {
    // UI保存形式: { date: "..." }
    moveInDate = (moveInRaw as Record<string, unknown>).date as string | null ?? null
  }

  // 貯金集計（しんご・あいり別）
  // profiles.display_name で振り分け
  let shingoSavings = 0
  let airiSavings = 0
  let totalSavings = 0

  for (const s of savings) {
    totalSavings += s.amount
    const name = (s.profiles as unknown as { display_name: string })?.display_name ?? ''
    if (name === 'しんご') {
      shingoSavings += s.amount
    } else {
      airiSavings += s.amount
    }
  }

  // 貯金目標（settingsテーブルから取得、なければデフォルト100万円）
  const savingsGoalRaw = savingsGoalResult.data?.value
  const savingsGoal = (savingsGoalRaw as Record<string, unknown>)?.amount
    ? Number((savingsGoalRaw as Record<string, unknown>).amount)
    : 1000000

  // 活動フィード用データを合成
  type Activity = {
    type: string
    user_name: string
    description: string
    created_at: string
  }

  const activities: Activity[] = []

  // 貯金記録をフィードに変換
  for (const s of recentSavingsResult.data ?? []) {
    const name = (s.profiles as unknown as { display_name: string })?.display_name ?? '?'
    activities.push({
      type: 'saving',
      user_name: name,
      description: `が貯金を ¥${s.amount.toLocaleString()} 追加しました`,
      created_at: s.created_at,
    })
  }

  // タスク完了をフィードに変換
  for (const t of recentTasksResult.data ?? []) {
    activities.push({
      type: 'task_done',
      user_name: t.assignee ?? '',
      description: `が「${t.title}」を完了しました`,
      created_at: t.completed_at ?? t.created_at,
    })
  }

  // 時系列でソートして上位5件
  activities.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const recentActivities = activities.slice(0, 5)

  // 進行中マイルストーンを取得
  const currentMilestone = milestones.find((m) => !m.is_completed) || null

  // 時間帯に応じた挨拶を生成
  const hour = new Date().getHours()
  const greeting = hour >= 5 && hour < 12
    ? 'おはよう'
    : hour >= 12 && hour < 18
      ? 'こんにちは'
      : 'こんばんは'

  // 今日の日付を日本語フォーマットで表示
  const todayStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="min-h-screen">
      {/* ヘッダー: 挨拶と今日の日付 */}
      <header className="px-6 pt-6 pb-2 max-w-5xl mx-auto">
        <p className="text-lg font-bold text-text">
          {greeting}！
        </p>
        <p className="text-sm text-text-sub mt-0.5">{todayStr}</p>
      </header>

      {/* メインコンテンツ - 各セクションに staggered fade-slide-up アニメーション */}
      <main className="mx-auto px-6 py-4 space-y-6">
        {/* 上段: カウントダウン(左) + 今月のやること(中央広め) + 貯金(右) */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-5 items-stretch">
          {/* カウントダウン */}
          <div className="lg:col-span-1 min-h-[420px] flex" style={{ animation: 'fade-slide-up 0.5s ease-out both', animationDelay: '0ms' }}>
            <div className="w-full flex flex-col">
              <CountdownBanner moveInDate={moveInDate} />
            </div>
          </div>

          {/* 現在のクエスト（4カラム分） */}
          <div className="lg:col-span-4 min-h-[420px] flex" style={{ animation: 'fade-slide-up 0.5s ease-out both', animationDelay: '100ms' }}>
            <TodoHighlight milestone={currentMilestone} />
          </div>

          {/* 貯金プログレス */}
          <div className="lg:col-span-1 min-h-[420px] flex" style={{ animation: 'fade-slide-up 0.5s ease-out both', animationDelay: '200ms' }}>
            <SavingsRing
              totalSavings={totalSavings}
              shingoSavings={shingoSavings}
              airiSavings={airiSavings}
              goal={savingsGoal}
            />
          </div>
        </div>

        {/* 下段: 最近の履歴 */}
        {recentActivities.length > 0 && (
          <div style={{ animation: 'fade-slide-up 0.5s ease-out both', animationDelay: '300ms' }}>
            <ActivityFeed activities={recentActivities} />
          </div>
        )}

        {/* 下部の余白 */}
        <div className="h-4" />
      </main>
    </div>
  )
}
