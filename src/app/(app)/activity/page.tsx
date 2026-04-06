import { createClient } from '@/lib/supabase/server'
import type { Saving, Task } from '@/lib/types'
import { ActivityPageClient } from '@/components/activity/ActivityPageClient'

// 更新履歴ページ（サーバーコンポーネント）
// 貯金記録と完了タスクを取得してクライアントに渡す
export default async function ActivityPage() {
  const supabase = await createClient()

  // 貯金記録を直近50件取得（プロフィール結合）
  const { data: savings, error: savingsError } = await supabase
    .from('savings')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  // 完了タスクを直近50件取得
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })
    .limit(50)

  // データ取得失敗時のフォールバック
  if ((savingsError && !savings) || (tasksError && !tasks)) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
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
    <ActivityPageClient
      savings={(savings as Saving[]) ?? []}
      completedTasks={(tasks as Task[]) ?? []}
    />
  )
}
