'use client'

import { useState } from 'react'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import type { Saving } from '@/lib/types'

// リアルタイム監視対象テーブル（貯金ページ用）
const REALTIME_TABLES = ['savings']
import { SavingsChart } from './SavingsChart'
import { MonthlySummary } from './MonthlySummary'
import { SavingsTable } from './SavingsTable'
import { AddSavingForm } from './AddSavingForm'

type Props = {
  initialSavings: Saving[]
  goal: number
  moveInDate: string | null
}

// 貯金管理ページのクライアント側ルートコンポーネント
// サーバーから受け取った初期データを各子コンポーネントに配信する
export function SavingsPageClient({ initialSavings, goal, moveInDate }: Props) {
  useRealtimeRefresh(REALTIME_TABLES)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="min-h-screen bg-bg">
      {/* ヘッダー */}
      <header className="px-4 pt-6 pb-2 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text font-[family-name:var(--font-quicksand)]">
              Savings
            </h1>
            <p className="text-sm text-text-sub mt-1">ふたりの貯金記録</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-full
                       text-sm font-medium shadow-md shadow-primary/25
                       hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5
                       active:translate-y-0 transition-all duration-200"
          >
            {showForm ? '閉じる' : '+ 記録する'}
          </button>
        </div>
      </header>

      <main className="px-4 pb-24 max-w-4xl mx-auto space-y-6">
        {/* 貯金追加フォーム（トグル表示） */}
        {showForm && (
          <div className="animate-[slideDown_0.3s_ease-out]">
            <AddSavingForm onClose={() => setShowForm(false)} />
          </div>
        )}

        {/* 月別サマリーカード */}
        <MonthlySummary savings={initialSavings} goal={goal} moveInDate={moveInDate} />

        {/* 貯金推移チャート */}
        <SavingsChart savings={initialSavings} goal={goal} />

        {/* 貯金記録一覧 */}
        <SavingsTable savings={initialSavings} />
      </main>
    </div>
  )
}
