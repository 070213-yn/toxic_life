'use client'

// エリア下見ページのメインクライアントコンポーネント
// 並び替え・フィルタ機能 + 比較モード付きのカードグリッド表示

import { useState, useCallback } from 'react'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import type { ScoutingArea } from '@/lib/types'

// リアルタイム監視対象テーブル（下見一覧ページ用）
const REALTIME_TABLES = ['scouting_areas', 'scouting_photos', 'scouting_ratings', 'scouting_comments']
import AreaCard from './AreaCard'
import AddAreaModal from './AddAreaModal'
import dynamic from 'next/dynamic'
const CompareView = dynamic(() => import('./CompareView'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"><p className="text-white text-sm">読み込み中...</p></div>,
})
import EmptyState from '@/components/EmptyState'

// 並び替えオプション
const SORT_OPTIONS = [
  { key: 'visited_date', label: '訪問日順' },
  { key: 'rating', label: '総合評価順' },
  { key: 'rent', label: '家賃順' },
  { key: 'affordability', label: '家賃の手頃さ順' },
  { key: 'shopping', label: '買い物の便利さ順' },
  { key: 'walkability', label: 'まちの雰囲気順' },
  { key: 'environment', label: '住環境順' },
  { key: 'safety', label: '治安順' },
  { key: 'overall', label: '住みたい度順' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['key']

type Props = {
  areas: ScoutingArea[]
}

// 全カテゴリの評価平均
function getAverageRating(area: ScoutingArea): number {
  const ratings = area.scouting_ratings || []
  if (ratings.length === 0) return 0
  return ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
}

// 特定カテゴリの評価平均
function getCategoryAvg(area: ScoutingArea, category: string): number {
  const ratings = (area.scouting_ratings || []).filter((r) => r.category === category)
  if (ratings.length === 0) return 0
  return ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length
}

// 家賃メモから数値を抽出
function extractRentNumber(memo: string | null): number {
  if (!memo) return Infinity
  const match = memo.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : Infinity
}

export default function ScoutingPageClient({ areas }: Props) {
  useRealtimeRefresh(REALTIME_TABLES)
  const [showModal, setShowModal] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('visited_date')

  const [compareMode, setCompareMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCompare, setShowCompare] = useState(false)

  // 並び替え
  const sortedAreas = [...areas].sort((a, b) => {
    switch (sortKey) {
      case 'visited_date':
        return (b.visited_date || '1970-01-01').localeCompare(a.visited_date || '1970-01-01')
      case 'rating':
        return getAverageRating(b) - getAverageRating(a)
      case 'rent':
        return extractRentNumber(a.rent_memo) - extractRentNumber(b.rent_memo)
      default:
        // カテゴリ別ソート
        return getCategoryAvg(b, sortKey) - getCategoryAvg(a, sortKey)
    }
  })

  const handleToggleSelect = useCallback((areaId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(areaId)) next.delete(areaId)
      else if (next.size < 3) next.add(areaId)
      return next
    })
  }, [])

  const toggleCompareMode = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) setSelectedIds(new Set())
      return !prev
    })
  }, [])

  const selectedAreas = areas.filter((a) => selectedIds.has(a.id))

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <div className="px-2 sm:px-6 pt-8 pb-2 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-text font-[family-name:var(--font-quicksand)]">
          Scouting
        </h1>
      </div>

      {/* ツールバー */}
      <div className="px-2 sm:px-6 max-w-7xl mx-auto mt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            エリアを追加
          </button>

          {areas.length >= 2 && (
            <button
              onClick={toggleCompareMode}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-200 ${
                compareMode
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-bg-card text-text-sub border border-primary-light/40 hover:border-primary/40 hover:text-primary'
              }`}
            >
              {compareMode ? 'やめる' : '比較する'}
            </button>
          )}
        </div>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-sm text-text-sub bg-bg-card border border-primary-light/40 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {SORT_OPTIONS.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* 比較モード時のステータスバー */}
      {compareMode && (
        <div className="px-2 sm:px-6 max-w-7xl mx-auto mt-3">
          <div className="bg-primary-light/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-text">
              {selectedIds.size === 0
                ? '比較したいエリアを2〜3つ選んでください'
                : `${selectedIds.size}件選択中（最大3件）`}
            </p>
            {selectedIds.size >= 2 && (
              <button
                onClick={() => setShowCompare(true)}
                className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:shadow-md transition-all duration-200"
              >
                比較を見る
              </button>
            )}
          </div>
        </div>
      )}

      {/* エリアカードグリッド */}
      <div className="px-2 sm:px-6 max-w-7xl mx-auto mt-5 pb-24 md:pb-8">
        {sortedAreas.length === 0 ? (
          <div className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30">
            <EmptyState
              icon="scouting"
              message="まだ下見エリアがありません"
              hint="「エリアを追加」ボタンから始めよう！"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedAreas.map((area) => (
              <AreaCard
                key={area.id}
                area={area}
                compareMode={compareMode}
                isSelected={selectedIds.has(area.id)}
                onToggleSelect={handleToggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && <AddAreaModal onClose={() => setShowModal(false)} />}
      {showCompare && selectedAreas.length >= 2 && (
        <CompareView areas={selectedAreas} onClose={() => setShowCompare(false)} />
      )}
    </div>
  )
}
