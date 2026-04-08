'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { BudgetTier, AreaRecommendation } from '@/lib/area-data'
import LivingCostSim from './LivingCostSim'
import SaleCalendar from './SaleCalendar'
import TimelineEditor from './TimelineEditor'

// 折りたたみセクションコンポーネント
function CollapsibleSection({
  icon,
  title,
  colorClass,
  bgClass,
  borderClass,
  children,
}: {
  icon: string
  title: string
  colorClass: string
  bgClass: string
  borderClass: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return (
    <div className={`rounded-2xl shadow-sm border ${borderClass} overflow-hidden`}>
      <button
        onClick={toggle}
        className={`w-full flex items-center gap-3 px-5 py-4 ${bgClass} transition-colors hover:brightness-95 text-left`}
      >
        <span className="text-xl">{icon}</span>
        <span className={`font-bold text-text flex-1`}>{title}</span>
        <svg
          className={`w-5 h-5 text-text-sub transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 py-4 bg-bg-card">{children}</div>
      </div>
    </div>
  )
}

// 星評価コンポーネント
function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="text-accent-warm">
      {'★'.repeat(Math.floor(count))}
      {count % 1 >= 0.5 && <span className="opacity-60">★</span>}
      <span className="text-text-sub/20">{'★'.repeat(max - Math.ceil(count))}</span>
    </span>
  )
}

// 総合評価バッジ
function RatingBadge({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-warm/20">
      <span className="text-accent-warm text-sm font-bold">★ {rating}</span>
    </div>
  )
}

// アクセス行コンポーネント（色分け付き）
function AccessRow({
  label,
  time,
  detail,
  colorClass,
  dotColor,
}: {
  label: string
  time: string
  detail: string
  colorClass: string
  dotColor: string
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <span className={`font-medium ${colorClass}`}>{label}</span>
        <span className="text-text ml-1.5 font-medium">{time}</span>
        <span className="text-text-sub text-xs ml-1">({detail})</span>
      </div>
    </div>
  )
}

// エリアカード
function AreaCard({ area, tierColor }: { area: AreaRecommendation; tierColor: string }) {
  return (
    <div
      className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderLeftWidth: '4px', borderLeftColor: tierColor }}
    >
      {/* ヘッダー: 評価 + エリア名 */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-text">{area.name}</h3>
          <p className="text-xs text-text-sub">{area.prefecture} / {area.station}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {area.lines.map((line) => (
              <span
                key={line}
                className="px-2 py-0.5 rounded-full text-[10px] bg-primary-light/40 text-text-sub"
              >
                {line}
              </span>
            ))}
          </div>
        </div>
        <RatingBadge rating={area.overallRating} />
      </div>

      {/* 家賃 */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-bg/80">
        <svg className="w-4 h-4 text-text-sub shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-bold text-text">{area.rentRange}</span>
        <span className="text-xs text-text-sub">/ 月</span>
      </div>

      {/* アクセス3行 */}
      <div className="space-y-1.5 mb-4">
        <AccessRow
          label="渋谷"
          time={area.access.shibuya.time}
          detail={area.access.shibuya.detail}
          colorClass="text-primary"
          dotColor="bg-primary"
        />
        <AccessRow
          label="辻堂"
          time={area.access.tsujido.time}
          detail={area.access.tsujido.detail}
          colorClass="text-success"
          dotColor="bg-success"
        />
        <AccessRow
          label="センター北"
          time={area.access.centerKita.time}
          detail={area.access.centerKita.detail}
          colorClass="text-blue-500"
          dotColor="bg-blue-500"
        />
      </div>

      {/* 街の評価 */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-bg/80">
        <div className="text-center">
          <p className="text-[10px] text-text-sub mb-0.5">買い物</p>
          <Stars count={area.shopping} />
        </div>
        <div className="text-center">
          <p className="text-[10px] text-text-sub mb-0.5">治安</p>
          <Stars count={area.safety} />
        </div>
        <div className="text-center">
          <p className="text-[10px] text-text-sub mb-0.5">散歩</p>
          <Stars count={area.walking} />
        </div>
      </div>

      {/* 説明 */}
      <p className="text-sm text-text leading-relaxed mb-3">{area.description}</p>

      {/* Highlights */}
      {area.highlights.length > 0 && (
        <ul className="space-y-1 mb-3">
          {area.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-text">
              <span className="text-success shrink-0 mt-0.5">&#10003;</span>
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Cautions */}
      {area.cautions.length > 0 && (
        <ul className="space-y-1 mb-3">
          {area.cautions.map((c, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-text-sub">
              <span className="text-accent-warm shrink-0 mt-0.5">&#9888;</span>
              {c}
            </li>
          ))}
        </ul>
      )}

      {/* SUUMOリンク + 下見リスト追加 */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-primary-light/20">
        {area.suumoUrl && (
          <a
            href={area.suumoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            SUUMOで検索
          </a>
        )}
        <Link
          href="/scouting"
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary-light/40 hover:bg-primary-light/60 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          下見リストに追加
        </Link>
      </div>
    </div>
  )
}

// メインコンポーネント
export default function AreaHintPageClient({ tiers }: { tiers: BudgetTier[] }) {
  // デフォルトはTier4（7万x2=14万）
  const [selectedTierId, setSelectedTierId] = useState('tier4')
  const selectedTier = tiers.find((t) => t.id === selectedTierId) ?? tiers[3]

  // 全エリア一覧（比較テーブル用）
  const allAreas = tiers.flatMap((tier) =>
    tier.areas.map((area) => ({ ...area, tierColor: tier.color, tierLabel: tier.totalLabel }))
  )

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* ヘッダー */}
      <div className="relative px-2 sm:px-6 pt-8 pb-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light/40 text-sm text-text-sub mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            エリア探し
          </div>
          <h1 className="text-2xl font-bold text-text">エリアヒント</h1>
          <p className="text-sm text-text-sub mt-2">
            1人いくら出せる？で見つかる、2人の新しい街
          </p>
        </div>
      </div>

      <div className="px-2 sm:px-6 max-w-4xl mx-auto space-y-6">
        {/* ===== 家賃帯セレクター（横スクロールチップ） ===== */}
        <div className="overflow-x-auto -mx-4 px-4 pt-4 pb-2">
          <div className="flex gap-2 min-w-max">
            {tiers.map((tier) => {
              const isSelected = tier.id === selectedTierId
              const isRecommended = tier.id === 'tier4'
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`
                    relative flex flex-col items-center px-4 py-2.5 rounded-xl
                    transition-all duration-200 whitespace-nowrap
                    ${isSelected
                      ? 'scale-105 shadow-md font-bold'
                      : 'hover:scale-102 opacity-70 hover:opacity-100'
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? tier.color + '40' : tier.color + '20',
                    borderWidth: '2px',
                    borderColor: isSelected ? tier.color : 'transparent',
                  }}
                >
                  {isRecommended && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary text-white whitespace-nowrap">
                      おすすめ
                    </span>
                  )}
                  <span className="text-xs text-text-sub">{tier.label.split('=')[0]}=</span>
                  <span className="text-sm font-bold text-text">{tier.totalLabel}</span>
                  {isSelected && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ===== 選択中の帯の説明カード ===== */}
        <div
          className="bg-bg-card rounded-2xl shadow-sm p-4"
          style={{ borderLeft: `4px solid ${selectedTier.color}` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedTier.color }}
            />
            <h2 className="font-bold text-text">
              1人{(selectedTier.perPerson / 10000).toFixed(0)}万円 x 2人 = 月{selectedTier.totalLabel}
            </h2>
          </div>
          <p className="text-sm text-text-sub leading-relaxed">{selectedTier.description}</p>
        </div>

        {/* ===== エリアカード一覧 ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {selectedTier.areas.map((area) => (
            <AreaCard key={area.id} area={area} tierColor={selectedTier.color} />
          ))}
        </div>

        {/* ===== 実家アクセスまとめ ===== */}
        <section className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-5">
          <h2 className="flex items-center gap-2 font-bold text-text mb-4">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            実家アクセスまとめ
          </h2>

          <div className="space-y-4">
            {/* しんご実家（辻堂） */}
            <div className="p-3 rounded-xl bg-success/10 border border-success/20">
              <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                しんご実家（辻堂）が近いエリア
              </h3>
              <ol className="space-y-1 text-sm text-text pl-4">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-success text-xs w-4">1.</span>
                  <span className="font-medium">相模大野</span>
                  <span className="text-text-sub text-xs">30〜35分</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-success text-xs w-4">2.</span>
                  <span className="font-medium">大和</span>
                  <span className="text-text-sub text-xs">30〜40分</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-success text-xs w-4">3.</span>
                  <span className="font-medium">日吉・綱島</span>
                  <span className="text-text-sub text-xs">40〜50分</span>
                </li>
              </ol>
            </div>

            {/* あいり実家（センター北） */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                あいり実家（センター北）が近いエリア
              </h3>
              <ol className="space-y-1 text-sm text-text pl-4">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-blue-500 text-xs w-4">1.</span>
                  <span className="font-medium">たまプラーザ</span>
                  <span className="text-text-sub text-xs">8〜12分</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-blue-500 text-xs w-4">2.</span>
                  <span className="font-medium">日吉</span>
                  <span className="text-text-sub text-xs">約9分</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-blue-500 text-xs w-4">3.</span>
                  <span className="font-medium">鷺沼</span>
                  <span className="text-text-sub text-xs">12〜16分</span>
                </li>
              </ol>
            </div>

            {/* 両方バランス */}
            <div className="p-3 rounded-xl bg-primary-light/30 border border-primary-light/50">
              <h3 className="text-sm font-bold text-text flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                両方バランス良いエリア
              </h3>
              <ol className="space-y-1 text-sm text-text pl-4">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-primary text-xs w-4">1.</span>
                  <span className="font-medium">日吉</span>
                  <span className="text-text-sub text-xs">辻堂40分・センター北9分</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-primary text-xs w-4">2.</span>
                  <span className="font-medium">綱島</span>
                  <span className="text-text-sub text-xs">辻堂40分・センター北15分</span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* ===== 全体比較テーブル ===== */}
        <section className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-5">
          <h2 className="flex items-center gap-2 font-bold text-text mb-4">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            全20エリア比較
          </h2>

          <div className="overflow-x-auto -mx-5 px-5 pb-2">
            <table className="w-full text-xs min-w-[800px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b-2 border-primary-light/40 bg-bg-card">
                  <th className="text-left py-2 pr-2 font-medium text-text-sub">帯</th>
                  <th className="text-left py-2 pr-2 font-medium text-text-sub">エリア</th>
                  <th className="text-left py-2 pr-2 font-medium text-text-sub">家賃</th>
                  <th className="text-left py-2 pr-2 font-medium text-text-sub">
                    <span className="text-primary">渋谷</span>
                  </th>
                  <th className="text-left py-2 pr-2 font-medium text-text-sub">
                    <span className="text-success">辻堂</span>
                  </th>
                  <th className="text-left py-2 pr-2 font-medium text-text-sub">
                    <span className="text-blue-500">セン北</span>
                  </th>
                  <th className="text-center py-2 pr-2 font-medium text-text-sub">買物</th>
                  <th className="text-center py-2 pr-2 font-medium text-text-sub">治安</th>
                  <th className="text-center py-2 pr-2 font-medium text-text-sub">散歩</th>
                  <th className="text-center py-2 font-medium text-text-sub">総合</th>
                </tr>
              </thead>
              <tbody>
                {allAreas.map((area) => (
                  <tr
                    key={area.id}
                    className="border-b border-primary-light/10 hover:bg-primary-light/10 transition-colors"
                    style={{ backgroundColor: area.tierColor + '10' }}
                  >
                    <td className="py-2 pr-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: area.tierColor }}
                        title={area.tierLabel}
                      />
                    </td>
                    <td className="py-2 pr-2 font-medium text-text whitespace-nowrap">{area.name}</td>
                    <td className="py-2 pr-2 text-text whitespace-nowrap">{area.rentRange}</td>
                    <td className="py-2 pr-2 text-text-sub whitespace-nowrap">{area.access.shibuya.time}</td>
                    <td className="py-2 pr-2 text-text-sub whitespace-nowrap">{area.access.tsujido.time}</td>
                    <td className="py-2 pr-2 text-text-sub whitespace-nowrap">{area.access.centerKita.time}</td>
                    <td className="py-2 pr-2 text-center text-accent-warm">{'★'.repeat(area.shopping)}</td>
                    <td className="py-2 pr-2 text-center text-accent-warm">{'★'.repeat(area.safety)}</td>
                    <td className="py-2 pr-2 text-center text-accent-warm">{'★'.repeat(area.walking)}</td>
                    <td className="py-2 text-center">
                      <span className="font-bold text-accent-warm">{area.overallRating}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== 参考情報セクション（タブ切り替え） ===== */}
        <RefInfoTabs />
      </div>
    </div>
  )
}

// 参考情報タブ切り替えコンポーネント
const REF_TABS = [
  { id: 'cost', label: '💰 生活費', shortLabel: '生活費' },
  { id: 'sale', label: '🛒 セール', shortLabel: 'セール' },
  { id: 'timeline', label: '📅 タイムライン', shortLabel: 'TL' },
] as const

function RefInfoTabs() {
  const [activeTab, setActiveTab] = useState<string>('cost')

  return (
    <div>
      <h2 className="flex items-center gap-2 font-bold text-text text-lg mb-3">
        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        参考情報
      </h2>

      {/* タブヘッダー */}
      <div className="flex gap-1 mb-4 bg-primary-light/20 rounded-xl p-1">
        {REF_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-bg-card text-primary shadow-sm'
                : 'text-text-sub hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="bg-bg-card/80 rounded-2xl border border-primary-light/30 p-4">
        {activeTab === 'cost' && <LivingCostSim />}
        {activeTab === 'sale' && <SaleCalendar />}
        {activeTab === 'timeline' && <TimelineEditor />}
      </div>
    </div>
  )
}
