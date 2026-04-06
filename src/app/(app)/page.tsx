import { createClient } from '@/lib/supabase/server'
import CountdownBanner from '@/components/dashboard/CountdownBanner'
import SavingsRing from '@/components/dashboard/SavingsRing'
import MilestoneMap from '@/components/dashboard/MilestoneMap'
import TodoHighlight from '@/components/dashboard/TodoHighlight'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import AddSavingModal from '@/components/dashboard/AddSavingModal'
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
    settingsResult,
    frierenResult,
    recentSavingsResult,
    recentTasksResult,
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

    // 設定（引越し日など）
    supabase
      .from('settings')
      .select('*')
      .eq('key', 'general')
      .single(),

    // フリーレン3期の日付を取得
    supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'frieren_date')
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
  ])

  const savings: Saving[] = savingsResult.data ?? []
  const milestones: Milestone[] = milestonesResult.data ?? []

  // 設定値から引越し日を取得
  const moveInDate = settingsResult.data?.value?.move_in_date as string | null ?? null

  // フリーレン3期の日付を取得（value.value の形式）
  const frierenDate = (frierenResult.data?.value as Record<string, unknown>)?.value as string | null ?? null

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

  // 貯金目標（設定から取得、デフォルト100万円）
  const savingsGoal = (settingsResult.data?.value?.savings_goal as number) ?? 1000000

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

  // 進行中マイルストーンのタスクを取得（未完了優先）
  const currentMilestone = milestones.find((m) => !m.is_completed)
  const highlightTasks: Task[] = currentMilestone?.tasks
    ? [...currentMilestone.tasks]
        .sort((a, b) => {
          // 未完了を上に、その中でsort_order順
          if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1
          return a.sort_order - b.sort_order
        })
        .slice(0, 5)
    : []

  return (
    <div className="min-h-screen bg-bg">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur-md border-b border-primary-light/30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-text">
            ふたりの旅路
          </h1>
          <span className="text-xs text-text-sub">同棲準備トラッカー</span>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* カウントダウン */}
        <CountdownBanner moveInDate={moveInDate} frierenDate={frierenDate} />

        {/* 貯金プログレス */}
        <SavingsRing
          totalSavings={totalSavings}
          shingoSavings={shingoSavings}
          airiSavings={airiSavings}
          goal={savingsGoal}
        />

        {/* 貯金記録ボタン */}
        <AddSavingModal />

        {/* ロードマップ */}
        <MilestoneMap milestones={milestones} />

        {/* 今月のTODO */}
        <TodoHighlight tasks={highlightTasks} />

        {/* 活動フィード */}
        <ActivityFeed activities={recentActivities} />

        {/* 下部の余白 */}
        <div className="h-8" />
      </main>
    </div>
  )
}
