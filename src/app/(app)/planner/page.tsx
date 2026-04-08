// プランナーページ（サーバーコンポーネント）
// 生活費シミュレーション・セールカレンダー・タイムラインを集約
import PlannerPageClient from '@/components/planner/PlannerPageClient'

export default function PlannerPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="px-2 sm:px-6 pt-8 pb-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-text font-[family-name:var(--font-quicksand)]">
          Planner
        </h1>
      </div>
      <div className="px-2 sm:px-6 max-w-4xl mx-auto">
        <PlannerPageClient />
      </div>
    </div>
  )
}
