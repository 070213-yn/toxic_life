import { createClient } from '@/lib/supabase/server'
import ShoppingPageClient from '@/components/shopping/ShoppingPageClient'
import type { ShoppingCategory } from '@/lib/types'

// 買い物リストページ（サーバーコンポーネント）
// カテゴリ → アイテム → 候補商品を一括取得してクライアントに渡す
export default async function ShoppingPage() {
  const supabase = await createClient()

  // カテゴリ一覧をアイテム・候補含めて取得
  const { data: categories, error } = await supabase
    .from('shopping_categories')
    .select('*, shopping_items(*, shopping_candidates(*))')
    .order('sort_order', { ascending: true })

  if (error && !categories) {
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

  // アイテムと候補をsort_order順にソート
  const sortedCategories: ShoppingCategory[] = (categories ?? []).map((cat) => ({
    ...cat,
    shopping_items: (cat.shopping_items ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((item: { shopping_candidates?: { sort_order: number }[] }) => ({
        ...item,
        shopping_candidates: (item.shopping_candidates ?? [])
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
      })),
  }))

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <div className="px-4 pt-8 pb-4 text-center">
        <h1 className="font-[family-name:var(--font-quicksand)] text-2xl font-bold text-text">
          Shopping List
        </h1>
      </div>

      {/* クライアントコンポーネント */}
      <ShoppingPageClient categories={sortedCategories} />
    </div>
  )
}
