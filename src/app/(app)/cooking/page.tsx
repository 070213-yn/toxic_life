import { createClient } from '@/lib/supabase/server'
import CookingPageClient from '@/components/cooking/CookingPageClient'
import type { CookingRecord } from '@/lib/types'

// 料理のきろくページ（サーバーコンポーネント）
// cooking_recordsをprofiles結合で全件取得し、作った日の降順で表示
export default async function CookingPage() {
  const supabase = await createClient()

  // 料理記録をプロフィール情報付きで取得（作った日の降順）
  const { data: records, error } = await supabase
    .from('cooking_records')
    .select('*, profiles(display_name, avatar_emoji)')
    .order('cooked_date', { ascending: false })

  if (error && !records) {
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
          Cooking Log
        </h1>
      </div>

      {/* クライアントコンポーネント */}
      <CookingPageClient records={(records ?? []) as CookingRecord[]} />
    </div>
  )
}
