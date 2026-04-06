'use client'

// エリアカードコンポーネント
// 一覧ページでエリアごとの概要を表示するカード
// 比較モード時はチェックボックスも表示

import Link from 'next/link'
import Image from 'next/image'
import type { ScoutingArea } from '@/lib/types'

type Props = {
  area: ScoutingArea
  compareMode?: boolean   // 比較モードかどうか
  isSelected?: boolean    // 比較対象として選択中か
  onToggleSelect?: (areaId: string) => void // チェックボックスの切り替え
}

// 評価の平均を計算
function getAverageRating(area: ScoutingArea): number {
  const ratings = area.scouting_ratings || []
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
  return sum / ratings.length
}

// 星を描画するヘルパー
function StarDisplay({ rating }: { rating: number }) {
  if (rating === 0) {
    return <span className="text-xs text-text-sub/50">未評価</span>
  }
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.25
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${
            i < full
              ? 'text-accent-warm'
              : i === full && hasHalf
              ? 'text-accent-warm/50'
              : 'text-text-sub/20'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-text-sub ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function AreaCard({ area, compareMode, isSelected, onToggleSelect }: Props) {
  const photos = area.scouting_photos || []
  const comments = area.scouting_comments || []
  const avgRating = getAverageRating(area)

  // カバー写真のURL取得（1枚目、なければnull）
  const coverPhoto = photos.length > 0 ? photos[0] : null
  const coverUrl = coverPhoto
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scouting-photos/${coverPhoto.storage_path}`
    : null

  // 訪問日フォーマット
  const visitedLabel = area.visited_date
    ? new Date(area.visited_date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '未訪問'

  // 比較モード時はチェックボックスクリックで選択、リンク遷移は無効
  const handleCardClick = (e: React.MouseEvent) => {
    if (compareMode) {
      e.preventDefault()
      onToggleSelect?.(area.id)
    }
  }

  const cardContent = (
    <div
      className={`bg-bg-card rounded-2xl shadow-sm border overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer relative ${
        isSelected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-primary-light/30'
      }`}
    >
      {/* 比較モード時のチェックボックス */}
      {compareMode && (
        <div className="absolute top-3 left-3 z-10">
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
              isSelected
                ? 'bg-primary border-primary'
                : 'bg-white/80 border-text-sub/30 backdrop-blur-sm'
            }`}
          >
            {isSelected && (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* カバー写真 */}
      <div className="relative w-full h-40 bg-primary-light/20">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={area.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-12 h-12 text-text-sub/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        )}
        {/* 写真枚数バッジ */}
        {photos.length > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            {photos.length}枚
          </div>
        )}
      </div>

      {/* カード内容 */}
      <div className="p-4">
        {/* エリア名 */}
        <h3 className="text-base font-bold text-text truncate">{area.name}</h3>

        {/* 最寄り駅・訪問日 */}
        <div className="flex items-center gap-2 mt-1.5 text-xs text-text-sub">
          {area.nearest_station && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {area.nearest_station}
            </span>
          )}
          <span>{visitedLabel}</span>
        </div>

        {/* 評価 */}
        <div className="mt-2.5">
          <StarDisplay rating={avgRating} />
        </div>

        {/* コメント抜粋（最大2件） */}
        {comments.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {comments.slice(0, 2).map((c) => {
              // profiles情報はJOINされている（display_name, avatar_emoji）
              const cProfile = (c as Record<string, unknown>).profiles as { display_name: string; avatar_emoji: string } | null
              return (
                <div key={c.id} className="flex items-start gap-1.5">
                  <span className="text-sm flex-shrink-0">{cProfile?.avatar_emoji || '\u{1F464}'}</span>
                  <p className="text-xs text-text-sub line-clamp-1">{c.comment}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // 比較モード時はリンクを無効化（カードクリックで選択のみ）
  if (compareMode) {
    return (
      <div onClick={handleCardClick}>
        {cardContent}
      </div>
    )
  }

  return (
    <Link href={`/scouting/${area.id}`}>
      {cardContent}
    </Link>
  )
}
