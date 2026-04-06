'use client'

// エリア比較ビュー
// 2〜3エリアを横並びで比較し、レーダーチャートで視覚化

import { useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ScoutingArea } from '@/lib/types'
import { RATING_CATEGORIES } from './RatingSection'

type Props = {
  areas: ScoutingArea[] // 比較対象のエリア（2〜3件）
  onClose: () => void
}

// パステルカラーパレット（エリアごとの色分け）
const AREA_COLORS = [
  { fill: 'rgba(184, 169, 232, 0.3)', stroke: '#B8A9E8' }, // primary
  { fill: 'rgba(255, 181, 194, 0.3)', stroke: '#FFB5C2' }, // accent
  { fill: 'rgba(168, 216, 185, 0.3)', stroke: '#A8D8B9' }, // success
]

// あるエリア・カテゴリの2人平均評価を取得
function getAvgRating(area: ScoutingArea, category: string): number {
  const ratings = (area.scouting_ratings || []).filter(
    (r) => r.category === category
  )
  if (ratings.length === 0) return 0
  return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
}

// 全カテゴリの総合平均
function getOverallAvg(area: ScoutingArea): number {
  let sum = 0
  let count = 0
  RATING_CATEGORIES.forEach(({ category }) => {
    const avg = getAvgRating(area, category)
    if (avg > 0) {
      sum += avg
      count++
    }
  })
  return count > 0 ? sum / count : 0
}

export default function CompareView({ areas, onClose }: Props) {
  // レーダーチャート用データ
  const radarData = useMemo(() => {
    return RATING_CATEGORIES.map(({ category, label }) => {
      const entry: Record<string, string | number> = { category: label }
      areas.forEach((area) => {
        entry[area.name] = parseFloat(getAvgRating(area, category).toFixed(1))
      })
      return entry
    })
  }, [areas])

  // 各項目でどのエリアが優れているかのサマリー
  const summary = useMemo(() => {
    return RATING_CATEGORIES.map(({ category, label, icon }) => {
      let bestArea = ''
      let bestScore = 0
      areas.forEach((area) => {
        const avg = getAvgRating(area, category)
        if (avg > bestScore) {
          bestScore = avg
          bestArea = area.name
        }
      })
      return { category, label, icon, bestArea, bestScore }
    }).filter((s) => s.bestScore > 0)
  }, [areas])

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-bg w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-xl animate-slide-up">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-bg z-10 px-5 pt-5 pb-3 border-b border-primary-light/30 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">エリア比較</h2>
            <p className="text-xs text-text-sub mt-0.5">
              {areas.map((a) => a.name).join(' vs ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary-light/30 transition-colors"
          >
            <svg
              className="w-5 h-5 text-text-sub"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* レーダーチャート */}
          <div className="bg-bg-card rounded-2xl border border-primary-light/30 p-4">
            <h3 className="text-sm font-bold text-text mb-3">
              レーダーチャート
            </h3>
            <div className="w-full" style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#E8E0FF" strokeOpacity={0.6} />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#9490A5' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 5]}
                    tick={{ fontSize: 10, fill: '#9490A5' }}
                    tickCount={6}
                  />
                  {areas.map((area, i) => (
                    <Radar
                      key={area.id}
                      name={area.name}
                      dataKey={area.name}
                      stroke={AREA_COLORS[i % AREA_COLORS.length].stroke}
                      fill={AREA_COLORS[i % AREA_COLORS.length].fill}
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: '#4A4458' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 比較テーブル */}
          <div className="bg-bg-card rounded-2xl border border-primary-light/30 overflow-hidden">
            <h3 className="text-sm font-bold text-text px-4 pt-4 pb-2">
              項目別スコア
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-light/30">
                    <th className="text-left px-4 py-2 text-text-sub font-normal text-xs">
                      項目
                    </th>
                    {areas.map((area, i) => (
                      <th
                        key={area.id}
                        className="text-center px-3 py-2 font-medium text-xs"
                        style={{
                          color:
                            AREA_COLORS[i % AREA_COLORS.length].stroke,
                        }}
                      >
                        {area.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATING_CATEGORIES.map(({ category, label, icon }) => {
                    // この項目の最高スコアを計算（ハイライト用）
                    const scores = areas.map((a) =>
                      getAvgRating(a, category)
                    )
                    const maxScore = Math.max(...scores)
                    return (
                      <tr
                        key={category}
                        className="border-b border-primary-light/10"
                      >
                        <td className="px-4 py-2.5 text-text">
                          <span className="mr-1.5">{icon}</span>
                          {label}
                        </td>
                        {areas.map((area, i) => {
                          const score = getAvgRating(area, category)
                          const isBest =
                            score > 0 && score === maxScore && maxScore > 0
                          return (
                            <td
                              key={area.id}
                              className={`text-center px-3 py-2.5 font-medium ${
                                isBest
                                  ? 'text-success font-bold'
                                  : score > 0
                                  ? 'text-text'
                                  : 'text-text-sub/40'
                              }`}
                            >
                              {score > 0 ? score.toFixed(1) : '-'}
                              {isBest && (
                                <span className="ml-0.5 text-xs">
                                  {'\u{1F451}'}
                                </span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  {/* 総合行 */}
                  <tr className="bg-primary-light/10 font-bold">
                    <td className="px-4 py-3 text-text">総合平均</td>
                    {areas.map((area) => {
                      const overall = getOverallAvg(area)
                      return (
                        <td
                          key={area.id}
                          className="text-center px-3 py-3 text-primary"
                        >
                          {overall > 0 ? overall.toFixed(1) : '-'}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 比較サマリー */}
          {summary.length > 0 && (
            <div className="bg-bg-card rounded-2xl border border-primary-light/30 px-5 py-4">
              <h3 className="text-sm font-bold text-text mb-3">
                まとめ
              </h3>
              <div className="space-y-2">
                {summary.map(({ category, label, icon, bestArea, bestScore }) => (
                  <div
                    key={category}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>{icon}</span>
                    <span className="text-text-sub">{label}:</span>
                    <span className="font-medium text-text">
                      {bestArea}
                    </span>
                    <span className="text-xs text-accent-warm">
                      ({bestScore.toFixed(1)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
