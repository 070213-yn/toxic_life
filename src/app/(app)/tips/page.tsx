// エリアヒントページ（サーバーコンポーネント）
// 家賃帯ごとにおすすめエリアを表示する静的ページ（DBアクセスなし）

import type { Metadata } from 'next'
import { BUDGET_TIERS } from '@/lib/area-data'
import AreaHintPageClient from '@/components/tips/AreaHintPageClient'

export const metadata: Metadata = {
  title: 'エリアヒント | 卍Toxic Life卍',
}

export default function TipsPage() {
  return <AreaHintPageClient tiers={BUDGET_TIERS} />
}
