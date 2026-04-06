import { createClient } from '@/lib/supabase/server'
import type { Saving } from '@/lib/types'
import { SavingsPageClient } from '@/components/savings/SavingsPageClient'

// 貯金管理ページ（サーバーコンポーネント）
// Supabaseから貯金記録・目標金額・引越し日を取得し、クライアントに渡す
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

  // settingsテーブルから目標金額と引越し日を取得
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['savings_goal', 'move_in_date'])

  // 目標金額（デフォルト100万円）
  // UI保存形式: { amount: 1000000 }
  const goalSetting = settings?.find((s) => s.key === 'savings_goal')
  const goalRaw = goalSetting?.value
  const goal = (goalRaw && typeof goalRaw === 'object' && 'amount' in goalRaw)
    ? Number((goalRaw as Record<string, unknown>).amount)
    : 1000000

  // 引越し日（設定がなければnull）
  // seed.sql形式: 文字列が直接JSONB値として格納（例: "2027-07-15"）
  // UI保存形式: { date: "2027-07-15" }
  const moveInSetting = settings?.find((s) => s.key === 'move_in_date')
  const moveInRaw = moveInSetting?.value
  let moveInDate: string | null = null
  if (typeof moveInRaw === 'string') {
    moveInDate = moveInRaw
  } else if (moveInRaw && typeof moveInRaw === 'object' && 'date' in moveInRaw) {
    moveInDate = (moveInRaw as Record<string, unknown>).date as string | null ?? null
  }

  // データ取得失敗時のフォールバック
  if (error && !savings) {
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
    <SavingsPageClient
      initialSavings={(savings as Saving[]) ?? []}
      goal={goal}
      moveInDate={moveInDate}
    />
  )
}
