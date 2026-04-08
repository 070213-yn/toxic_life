'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { ShoppingCategory, ShoppingItem, ShoppingCandidate } from '@/lib/types'

// リアルタイム監視テーブル

// ステータス定義
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  not_started: { label: '未検討', color: 'text-text-sub', bgColor: 'bg-gray-100' },
  considering: { label: '検討中', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  decided: { label: '仮決定', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  purchased: { label: '購入済み', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
}

// 優先度定義
const PRIORITY_CONFIG: Record<string, { label: string; mark: string; colorClass: string }> = {
  must: { label: '必須', mark: '◎', colorClass: 'text-accent' },
  nice: { label: 'あると良い', mark: '○', colorClass: 'text-primary' },
  later: { label: '余裕あったら', mark: '△', colorClass: 'text-text-sub' },
}

// フィルターチップ
const STATUS_FILTERS = [
  { key: 'all', label: '全て' },
  { key: 'not_started', label: '未検討' },
  { key: 'considering', label: '検討中' },
  { key: 'decided', label: '仮決定' },
  { key: 'purchased', label: '購入済み' },
]

// 購入時期フィルター
const TIMING_FILTERS = [
  { key: 'all', label: '全て' },
  { key: 'セールで早めに', label: 'セールで早めに' },
  { key: 'プライムデー（7月）', label: 'プライムデー' },
  { key: 'ブラックフライデー（11月）', label: 'ブラックフライデー' },
  { key: '新生活セール（3月）', label: '新生活セール' },
  { key: '同棲直前（6月）', label: '同棲直前' },
  { key: '同棲開始後', label: '同棲開始後' },
  { key: 'unset', label: '未設定' },
]

// 金額フォーマット
function formatPrice(price: number): string {
  return '¥' + price.toLocaleString('ja-JP')
}

// カウントアップアニメーション用フック
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0)
  const prevTarget = useRef(target)

  useEffect(() => {
    const start = prevTarget.current
    prevTarget.current = target
    if (start === target) {
      setValue(target)
      return
    }
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // イージング: easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + (target - start) * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])

  return value
}

type Props = {
  categories: ShoppingCategory[]
}

export default function ShoppingPageClient({ categories: initialCategories }: Props) {
  const router = useRouter()
  // リアルタイム監視

  // ローカルstate（楽観的更新用）
  const [categories, setCategories] = useState(initialCategories)

  // DB操作後にサーバーデータを再取得する共通関数
  const refreshData = useCallback(() => {
    router.refresh()
  }, [router])

  // propsが変わったら同期（リアルタイム更新時）
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  // フィルター状態
  const [statusFilter, setStatusFilter] = useState('all')
  const [mustOnly, setMustOnly] = useState(false)
  const [timingFilter, setTimingFilter] = useState('all')

  // アコーディオン開閉状態（カテゴリID → 開閉）
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    categories.forEach((cat) => { initial[cat.id] = true })
    return initial
  })

  // 候補追加モーダル
  const [addCandidateModal, setAddCandidateModal] = useState<{ itemId: string } | null>(null)
  const [candidateForm, setCandidateForm] = useState({ product_name: '', price: '', url: '', memo: '' })
  const [isSavingCandidate, setIsSavingCandidate] = useState(false)

  // アイテム追加
  const [addItemModal, setAddItemModal] = useState<{ categoryId: string } | null>(null)
  const [itemForm, setItemForm] = useState({ name: '', priority: 'must' })
  const [isSavingItem, setIsSavingItem] = useState(false)

  // アイテム編集
  const [editItemModal, setEditItemModal] = useState<{ item: ShoppingItem } | null>(null)
  const [editItemForm, setEditItemForm] = useState({ name: '', priority: 'must', planned_timing: '', memo: '' })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // 統計計算
  const stats = useMemo(() => {
    let totalPrice = 0
    let totalItems = 0
    let decidedItems = 0

    categories.forEach((cat) => {
      cat.shopping_items?.forEach((item) => {
        totalItems++
        const selected = item.shopping_candidates?.find((c) => c.is_selected)
        if (selected) {
          decidedItems++
          if (selected.price) totalPrice += selected.price
        }
      })
    })

    return { totalPrice, totalItems, decidedItems }
  }, [categories])

  // カウントアップアニメーション
  const animatedPrice = useCountUp(stats.totalPrice)

  // カテゴリ別統計
  const categoryStats = useMemo(() => {
    const result: Record<string, { decided: number; total: number; subtotal: number }> = {}
    categories.forEach((cat) => {
      let decided = 0
      let total = 0
      let subtotal = 0
      cat.shopping_items?.forEach((item) => {
        total++
        const selected = item.shopping_candidates?.find((c) => c.is_selected)
        if (selected) {
          decided++
          if (selected.price) subtotal += selected.price
        }
      })
      result[cat.id] = { decided, total, subtotal }
    })
    return result
  }, [categories])

  // フィルター適用後のカテゴリ
  const filteredCategories = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      shopping_items: cat.shopping_items?.filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        if (mustOnly && item.priority !== 'must') return false
        // 購入時期フィルター
        if (timingFilter !== 'all') {
          if (timingFilter === 'unset') {
            if (item.planned_timing) return false
          } else {
            if (item.planned_timing !== timingFilter) return false
          }
        }
        return true
      }),
    })).filter((cat) => (cat.shopping_items?.length ?? 0) > 0)
  }, [categories, statusFilter, mustOnly, timingFilter])

  // アコーディオン切り替え
  const toggleCategory = useCallback((catId: string) => {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }, [])

  // 候補の仮決定切り替え（楽観的UI更新 + DB保存）
  const toggleCandidateSelected = useCallback(async (candidate: ShoppingCandidate, itemId: string) => {
    const newSelected = !candidate.is_selected

    // 仮決定解除時: そのアイテムの候補数を確認してステータスを決定
    let newStatusOnDeselect = 'not_started'
    if (!newSelected) {
      // 現在のアイテムを探して候補数を確認
      for (const cat of categories) {
        const item = cat.shopping_items?.find((i) => i.id === itemId)
        if (item) {
          // 候補が1件以上あれば「検討中」、0件なら「未検討」
          const candidateCount = item.shopping_candidates?.length ?? 0
          newStatusOnDeselect = candidateCount > 0 ? 'considering' : 'not_started'
          break
        }
      }
    }

    // 楽観的更新: ローカルstateを即座に変更
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        shopping_items: cat.shopping_items?.map((item) => {
          if (item.id !== itemId) return item
          return {
            ...item,
            status: newSelected ? 'decided' : newStatusOnDeselect,
            shopping_candidates: item.shopping_candidates?.map((c) => ({
              ...c,
              is_selected: c.id === candidate.id ? newSelected : false,
            })),
          }
        }),
      }))
    )

    // DB保存
    if (newSelected) {
      await supabase.from('shopping_candidates').update({ is_selected: false }).eq('item_id', itemId)
      await supabase.from('shopping_candidates').update({ is_selected: true }).eq('id', candidate.id)
      await supabase.from('shopping_items').update({ status: 'decided' }).eq('id', itemId)
    } else {
      await supabase.from('shopping_candidates').update({ is_selected: false }).eq('id', candidate.id)
      await supabase.from('shopping_items').update({ status: newStatusOnDeselect }).eq('id', itemId)
    }
  }, [categories])

  // 候補追加
  const handleAddCandidate = useCallback(async () => {
    if (!addCandidateModal || !candidateForm.product_name.trim()) return
    setIsSavingCandidate(true)

    // 現在の候補数を取得してsort_orderを決定
    const { count } = await supabase
      .from('shopping_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', addCandidateModal.itemId)

    await supabase.from('shopping_candidates').insert({
      item_id: addCandidateModal.itemId,
      product_name: candidateForm.product_name.trim(),
      price: candidateForm.price ? parseInt(candidateForm.price) : null,
      url: candidateForm.url.trim() || null,
      memo: candidateForm.memo.trim() || null,
      sort_order: (count ?? 0),
    })

    // まだ未検討なら検討中に変更
    await supabase
      .from('shopping_items')
      .update({ status: 'considering' })
      .eq('id', addCandidateModal.itemId)
      .eq('status', 'not_started')

    setIsSavingCandidate(false)
    setCandidateForm({ product_name: '', price: '', url: '', memo: '' })
    setAddCandidateModal(null)
    refreshData()
  }, [addCandidateModal, candidateForm, refreshData])

  // 候補削除
  const deleteCandidate = useCallback(async (candidateId: string) => {
    if (!confirm('この候補を削除しますか？')) return
    await supabase.from('shopping_candidates').delete().eq('id', candidateId)
    refreshData()
  }, [refreshData])

  // アイテム追加
  const handleAddItem = useCallback(async () => {
    if (!addItemModal || !itemForm.name.trim()) return
    setIsSavingItem(true)

    const { count } = await supabase
      .from('shopping_items')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', addItemModal.categoryId)

    await supabase.from('shopping_items').insert({
      category_id: addItemModal.categoryId,
      name: itemForm.name.trim(),
      priority: itemForm.priority,
      sort_order: (count ?? 0),
    })

    setIsSavingItem(false)
    setItemForm({ name: '', priority: 'must' })
    setAddItemModal(null)
    refreshData()
  }, [addItemModal, itemForm, refreshData])

  // アイテム編集
  const handleEditItem = useCallback(async () => {
    if (!editItemModal || !editItemForm.name.trim()) return
    setIsSavingEdit(true)

    await supabase.from('shopping_items').update({
      name: editItemForm.name.trim(),
      priority: editItemForm.priority,
      planned_timing: editItemForm.planned_timing.trim() || null,
      memo: editItemForm.memo.trim() || null,
    }).eq('id', editItemModal.item.id)

    setIsSavingEdit(false)
    setEditItemModal(null)
    refreshData()
  }, [editItemModal, editItemForm, refreshData])

  // アイテム削除
  const deleteItem = useCallback(async (itemId: string) => {
    if (!confirm('このアイテムと候補をすべて削除しますか？')) return
    await supabase.from('shopping_items').delete().eq('id', itemId)
    refreshData()
  }, [refreshData])

  // 編集モーダルを開く
  const openEditItem = useCallback((item: ShoppingItem) => {
    setEditItemForm({
      name: item.name,
      priority: item.priority,
      planned_timing: item.planned_timing ?? '',
      memo: item.memo ?? '',
    })
    setEditItemModal({ item })
  }, [])

  // カテゴリ追加
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '', emoji: '' })
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  const handleAddCategory = useCallback(async () => {
    if (!categoryForm.name.trim()) return
    setIsSavingCategory(true)

    // 既存カテゴリの最大sort_orderを取得
    const maxSortOrder = categories.reduce((max, cat) => Math.max(max, cat.sort_order), 0)

    await supabase.from('shopping_categories').insert({
      name: categoryForm.name.trim(),
      emoji: categoryForm.emoji.trim() || null,
      sort_order: maxSortOrder + 1,
    })

    setIsSavingCategory(false)
    setCategoryForm({ name: '', emoji: '' })
    setShowAddCategory(false)
    refreshData()
  }, [categoryForm, categories, refreshData])

  // カテゴリ削除
  const deleteCategory = useCallback(async (catId: string) => {
    if (!confirm('このカテゴリと中のアイテムをすべて削除しますか？')) return

    // 楽観的更新
    setCategories((prev) => prev.filter((cat) => cat.id !== catId))

    await supabase.from('shopping_categories').delete().eq('id', catId)
    refreshData()
  }, [refreshData])

  // ステータス変更（楽観的UI更新）
  const handleStatusChange = useCallback(async (itemId: string, newStatus: string) => {
    // 楽観的更新
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        shopping_items: cat.shopping_items?.map((item) => {
          if (item.id !== itemId) return item
          return { ...item, status: newStatus }
        }),
      }))
    )
    await supabase.from('shopping_items').update({ status: newStatus }).eq('id', itemId)
  }, [])

  // 優先度変更（楽観的UI更新）
  const handlePriorityChange = useCallback(async (itemId: string, newPriority: string) => {
    // 楽観的更新
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        shopping_items: cat.shopping_items?.map((item) => {
          if (item.id !== itemId) return item
          return { ...item, priority: newPriority }
        }),
      }))
    )
    await supabase.from('shopping_items').update({ priority: newPriority }).eq('id', itemId)
  }, [])

  return (
    <div className="px-2 sm:px-6 pb-28 md:pb-8 max-w-7xl mx-auto">
      {/* 合計金額パネル（sticky・コンパクト） */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-bg/80 backdrop-blur-md">
        <div className="bg-bg-card rounded-xl px-4 py-2.5 shadow-sm border border-primary-light/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-primary font-[family-name:var(--font-quicksand)]"
                 style={{ animation: 'count-up-glow 0.6s ease-out' }}
              >
                {formatPrice(animatedPrice)}
              </p>
              <span className="text-xs text-text-sub">仮決定合計</span>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-text-sub">
                {stats.decidedItems}/{stats.totalItems} 件仮決定
              </p>
              {/* プログレスバー */}
              <div className="w-20 h-1.5 bg-primary-light/30 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${stats.totalItems > 0 ? (stats.decidedItems / stats.totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フィルターチップ */}
      <div className="mt-3 space-y-1.5">
        {/* 1行目: ステータス + 必須のみ */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                statusFilter === f.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-bg-card text-text-sub border border-primary-light/30 hover:border-primary/40'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="w-px h-6 bg-primary-light/30 self-center mx-1" />
          <button
            onClick={() => setMustOnly(!mustOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              mustOnly
                ? 'bg-accent text-white shadow-sm'
                : 'bg-bg-card text-text-sub border border-primary-light/30 hover:border-accent/40'
            }`}
          >
            必須のみ
          </button>
        </div>
        {/* 2行目: 購入時期フィルター（横スクロール） */}
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[11px] text-text-sub font-medium">購入時期:</span>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {TIMING_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setTimingFilter(f.key)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 ${
                  timingFilter === f.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-bg-card text-text-sub border border-primary-light/30 hover:border-primary/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* カテゴリ別アコーディオン */}
      <div className="mt-4 space-y-3">
        {filteredCategories.map((cat) => {
          const catStat = categoryStats[cat.id]
          const isOpen = openCategories[cat.id] ?? true

          return (
            <div key={cat.id} className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/20 overflow-hidden group/cat">
              {/* カテゴリヘッダー */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="flex-1 px-4 py-3.5 flex items-center justify-between hover:bg-primary-light/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="font-medium text-sm text-text">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-sub">
                      仮決定 {catStat?.decided ?? 0}/{catStat?.total ?? 0}件
                      {(catStat?.subtotal ?? 0) > 0 && (
                        <> | <span className="text-primary font-medium">{formatPrice(catStat.subtotal)}</span></>
                      )}
                    </span>
                    <svg
                      className={`w-4 h-4 text-text-sub transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {/* カテゴリ削除ボタン（ホバーで表示） */}
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="shrink-0 p-2 mr-2 text-text-sub/0 group-hover/cat:text-text-sub/40 hover:!text-red-500 transition-all duration-200"
                  title="カテゴリを削除"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* アイテム一覧 */}
              {isOpen && (
                <div className="border-t border-primary-light/15 grid grid-cols-1 lg:grid-cols-2">
                  {cat.shopping_items?.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onStatusChange={handleStatusChange}
                      onPriorityChange={handlePriorityChange}
                      onToggleCandidate={toggleCandidateSelected}
                      onAddCandidate={(itemId) => {
                        setCandidateForm({ product_name: '', price: '', url: '', memo: '' })
                        setAddCandidateModal({ itemId })
                      }}
                      onDeleteCandidate={deleteCandidate}
                      onEdit={openEditItem}
                      onDelete={deleteItem}
                    />
                  ))}

                  {/* アイテム追加ボタン */}
                  <button
                    onClick={() => {
                      setItemForm({ name: '', priority: 'must' })
                      setAddItemModal({ categoryId: cat.id })
                    }}
                    className="w-full lg:col-span-2 px-4 py-3 flex items-center gap-2 text-xs text-text-sub hover:text-primary hover:bg-primary-light/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    アイテムを追加
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* カテゴリ追加 */}
      <div className="mt-4">
        {showAddCategory ? (
          <div className="bg-bg-card rounded-2xl shadow-sm border border-dashed border-primary-light/40 p-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-sub mb-1">カテゴリ名 *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="例: 玄関"
                  className="w-full px-3 py-2 rounded-xl border border-primary-light/30 bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-text-sub mb-1">絵文字</label>
                <input
                  type="text"
                  value={categoryForm.emoji}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, emoji: e.target.value }))}
                  placeholder="📦"
                  className="w-full px-3 py-2 rounded-xl border border-primary-light/30 bg-white text-sm text-text text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddCategory(false); setCategoryForm({ name: '', emoji: '' }) }}
                className="flex-1 py-2 rounded-xl text-xs font-medium text-text-sub bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!categoryForm.name.trim() || isSavingCategory}
                className="flex-1 py-2 rounded-xl text-xs font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {isSavingCategory ? '追加中...' : '追加する'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCategory(true)}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-primary-light/30 text-text-sub text-xs font-medium hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            カテゴリを追加
          </button>
        )}
      </div>

      {/* フィルター結果なし */}
      {filteredCategories.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-text-sub text-sm">条件に合うアイテムがありません</p>
        </div>
      )}

      {/* ===== 候補追加モーダル ===== */}
      {addCandidateModal && (
        <BottomSheet onClose={() => setAddCandidateModal(null)} title="候補を追加">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">商品名 *</label>
              <input
                type="text"
                value={candidateForm.product_name}
                onChange={(e) => setCandidateForm((p) => ({ ...p, product_name: e.target.value }))}
                placeholder="例: REGZA 43C350X"
                className="w-full px-3 py-2.5 rounded-xl border border-primary-light/30 bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">価格</label>
              <input
                type="number"
                value={candidateForm.price}
                onChange={(e) => setCandidateForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="例: 45000"
                className="w-full px-3 py-2.5 rounded-xl border border-primary-light/30 bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">URL</label>
              <input
                type="url"
                value={candidateForm.url}
                onChange={(e) => setCandidateForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl border border-primary-light/30 bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">メモ</label>
              <textarea
                value={candidateForm.memo}
                onChange={(e) => setCandidateForm((p) => ({ ...p, memo: e.target.value }))}
                placeholder="気になるポイントなど"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-light/30 bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button
              onClick={handleAddCandidate}
              disabled={!candidateForm.product_name.trim() || isSavingCandidate}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {isSavingCandidate ? '追加中...' : '追加する'}
            </button>
          </div>
        </BottomSheet>
      )}

      {/* ===== アイテム追加モーダル ===== */}
      {addItemModal && (
        <BottomSheet onClose={() => setAddItemModal(null)} title="アイテムを追加">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">アイテム名 *</label>
              <input
                type="text"
                value={itemForm.name}
                onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="例: サーキュレーター"
                className="w-full px-3 py-2.5 rounded-xl border border-primary-light/30 bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">優先度</label>
              <div className="flex gap-2">
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setItemForm((p) => ({ ...p, priority: key }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                      itemForm.priority === key
                        ? 'bg-primary text-white'
                        : 'bg-primary-light/20 text-text-sub hover:bg-primary-light/40'
                    }`}
                  >
                    {cfg.mark} {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAddItem}
              disabled={!itemForm.name.trim() || isSavingItem}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {isSavingItem ? '追加中...' : '追加する'}
            </button>
          </div>
        </BottomSheet>
      )}

      {/* ===== アイテム編集モーダル ===== */}
      {editItemModal && (
        <BottomSheet onClose={() => setEditItemModal(null)} title="アイテムを編集">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">アイテム名 *</label>
              <input
                type="text"
                value={editItemForm.name}
                onChange={(e) => setEditItemForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-light/30 bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">優先度</label>
              <div className="flex gap-2">
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setEditItemForm((p) => ({ ...p, priority: key }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                      editItemForm.priority === key
                        ? 'bg-primary text-white'
                        : 'bg-primary-light/20 text-text-sub hover:bg-primary-light/40'
                    }`}
                  >
                    {cfg.mark} {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">購入予定時期</label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {['セールで早めに', 'プライムデー（7月）', 'ブラックフライデー（11月）', '新生活セール（3月）', '同棲直前（6月）', '同棲開始後'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setEditItemForm((p) => ({ ...p, planned_timing: opt }))}
                    className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                      editItemForm.planned_timing === opt
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-text-sub border-primary-light/40 hover:border-primary/40'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={editItemForm.planned_timing}
                onChange={(e) => setEditItemForm((p) => ({ ...p, planned_timing: e.target.value }))}
                placeholder="自由入力もOK"
                className="w-full px-3 py-2 rounded-xl border border-primary-light/30 bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-text-sub/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-sub mb-1">メモ</label>
              <textarea
                value={editItemForm.memo}
                onChange={(e) => setEditItemForm((p) => ({ ...p, memo: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-primary-light/30 bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <button
              onClick={handleEditItem}
              disabled={!editItemForm.name.trim() || isSavingEdit}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {isSavingEdit ? '保存中...' : '保存する'}
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

// ===== ドロップダウンメニュー コンポーネント =====
function DropdownMenu({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 z-20 bg-bg-card rounded-lg shadow-lg border border-primary-light/30 py-1 min-w-[120px]">
      {children}
    </div>
  )
}

// ===== アイテムカード コンポーネント =====
function ItemCard({
  item,
  onStatusChange,
  onPriorityChange,
  onToggleCandidate,
  onAddCandidate,
  onDeleteCandidate,
  onEdit,
  onDelete,
}: {
  item: ShoppingItem
  onStatusChange: (id: string, status: string) => void
  onPriorityChange: (id: string, priority: string) => void
  onToggleCandidate: (candidate: ShoppingCandidate, itemId: string) => void
  onAddCandidate: (itemId: string) => void
  onDeleteCandidate: (candidateId: string) => void
  onEdit: (item: ShoppingItem) => void
  onDelete: (itemId: string) => void
}) {
  const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.not_started
  const priorityCfg = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.must
  const [showActions, setShowActions] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)

  return (
    <div className="px-4 py-3 border-b border-primary-light/10 lg:border-b lg:border-r lg:border-primary-light/10 transition-all duration-300"
         style={{ animation: 'fade-slide-up 0.3s ease-out' }}
    >
      {/* 上段: ステータス・アイテム名・優先度 */}
      <div className="flex items-start gap-2.5">
        {/* ステータスバッジ（タップでドロップダウン） */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-200 ${statusCfg.bgColor} ${statusCfg.color} hover:opacity-80`}
          >
            {statusCfg.label}
          </button>
          <DropdownMenu isOpen={showStatusMenu} onClose={() => setShowStatusMenu(false)}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => {
                  onStatusChange(item.id, key)
                  setShowStatusMenu(false)
                }}
                className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 ${
                  item.status === key
                    ? 'bg-primary-light/20 font-medium'
                    : 'hover:bg-primary-light/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.bgColor} border ${
                  key === 'not_started' ? 'border-gray-300' :
                  key === 'considering' ? 'border-amber-300' :
                  key === 'decided' ? 'border-purple-300' :
                  'border-emerald-300'
                }`} />
                <span className={cfg.color}>{cfg.label}</span>
              </button>
            ))}
          </DropdownMenu>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-text truncate">{item.name}</span>
            {/* 優先度バッジ（タップでドロップダウン） */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                className={`text-[10px] ${priorityCfg.colorClass} hover:opacity-70 transition-opacity`}
              >
                {priorityCfg.mark}{priorityCfg.label}
              </button>
              <DropdownMenu isOpen={showPriorityMenu} onClose={() => setShowPriorityMenu(false)}>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onPriorityChange(item.id, key)
                      setShowPriorityMenu(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2 ${
                      item.priority === key
                        ? 'bg-primary-light/20 font-medium'
                        : 'hover:bg-primary-light/10'
                    }`}
                  >
                    <span className={cfg.colorClass}>{cfg.mark} {cfg.label}</span>
                  </button>
                ))}
              </DropdownMenu>
            </div>
          </div>

          {/* 購入時期バッジ（常に表示） */}
          {item.planned_timing && (
            <span className="inline-flex items-center gap-0.5 mt-0.5 bg-primary-light/20 text-text-sub text-[10px] rounded-full px-2 py-0.5">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {item.planned_timing}
            </span>
          )}
          {/* メモ */}
          {item.memo && (
            <p className="mt-0.5 text-[10px] text-text-sub/70">{item.memo}</p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 text-text-sub/40 hover:text-text-sub transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-6 z-20 bg-bg-card rounded-xl shadow-lg border border-primary-light/30 py-1 min-w-[100px]">
                <button
                  onClick={() => { onEdit(item); setShowActions(false) }}
                  className="w-full px-3 py-2 text-left text-xs text-text hover:bg-primary-light/10 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => { onDelete(item.id); setShowActions(false) }}
                  className="w-full px-3 py-2 text-left text-xs text-accent hover:bg-accent/10 transition-colors"
                >
                  削除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 候補商品リスト */}
      {(item.shopping_candidates?.length ?? 0) > 0 && (
        <div className="mt-2.5 ml-0.5 space-y-1.5">
          {item.shopping_candidates?.map((cand) => (
            <div
              key={cand.id}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-200 ${
                cand.is_selected
                  ? 'bg-primary-light/30 border border-primary/20'
                  : 'bg-gray-50 border border-transparent hover:border-primary-light/20'
              }`}
            >
              {/* ラジオボタン */}
              <button
                onClick={() => onToggleCandidate(cand, item.id)}
                className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                  cand.is_selected
                    ? 'border-primary bg-primary'
                    : 'border-gray-300 hover:border-primary/50'
                }`}
              >
                {cand.is_selected && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium truncate ${cand.is_selected ? 'text-primary' : 'text-text'}`}>
                    {cand.product_name}
                  </span>
                  {cand.price != null && (
                    <span className={`shrink-0 text-xs font-medium ${cand.is_selected ? 'text-primary' : 'text-text-sub'}`}>
                      {formatPrice(cand.price)}
                    </span>
                  )}
                </div>
                {(cand.url || cand.memo) && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {cand.url && (
                      <a
                        href={cand.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:underline truncate max-w-[150px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        リンク
                      </a>
                    )}
                    {cand.memo && <span className="text-[10px] text-text-sub/60 truncate">{cand.memo}</span>}
                  </div>
                )}
              </div>

              {/* 候補削除 */}
              <button
                onClick={() => onDeleteCandidate(cand.id)}
                className="shrink-0 p-1 text-text-sub/30 hover:text-accent transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 候補追加ボタン */}
      <button
        onClick={() => onAddCandidate(item.id)}
        className="mt-2 ml-0.5 flex items-center gap-1 text-[11px] text-text-sub hover:text-primary transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        候補を追加
      </button>
    </div>
  )
}

// ===== ボトムシート コンポーネント =====
function BottomSheet({
  onClose,
  title,
  children,
}: {
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fade-slide-up 0.2s ease-out' }}
      />
      {/* シート本体 */}
      <div
        className="relative w-full max-w-md bg-bg-card rounded-t-3xl md:rounded-3xl p-6 pb-8 shadow-xl"
        style={{ animation: 'fade-slide-up 0.3s ease-out' }}
      >
        {/* ドラッグハンドル（モバイル） */}
        <div className="md:hidden w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-text">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-text-sub hover:text-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
