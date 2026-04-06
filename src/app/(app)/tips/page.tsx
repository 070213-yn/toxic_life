// 物件ヒントページ（番外編）
// ふたりの家探しに役立つ調査データを見やすくまとめた静的ページ

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '物件ヒント | 卍Toxic Life卍',
}

// 既存候補エリアのデータ
const existingAreas = [
  { name: '十条', rent: '16〜25万', access: '20分直通', shopping: 5, safety: '◎', feasibility: '×', color: 'accent' },
  { name: '東十条', rent: '12〜15万', access: '35-40分', shopping: 3, safety: '◎', feasibility: '×', color: 'accent' },
  { name: '赤羽', rent: '14〜18万', access: '25分直通', shopping: 2, safety: '△', feasibility: '×', color: 'accent', note: '飲み系' },
  { name: '大山', rent: '13〜15万', access: '25-30分', shopping: 3, safety: '◎', feasibility: '△', color: 'accent-warm' },
  { name: '王子', rent: '10〜15万', access: '35-40分', shopping: 2, safety: '△', feasibility: '△', color: 'accent-warm' },
]

// 予算内おすすめエリア
const recommendedAreas = [
  {
    name: '川越',
    rent: '6.5〜9万',
    highlight: '散歩 No.1',
    access: '副都心線直通50-60分',
    features: ['小江戸の風情ある街並み', '蔵造りの街歩きが楽しい', '食べ歩きスポット豊富'],
    icon: '🏯',
    color: 'bg-amber-50 border-amber-200',
  },
  {
    name: '蕨',
    rent: '7〜9万',
    highlight: 'コスパ良',
    access: '渋谷37分',
    features: ['京浜東北線で都心直通', '日本一小さい市で生活圏コンパクト', '物価も安め'],
    icon: '🚃',
    color: 'bg-sky-50 border-sky-200',
  },
  {
    name: '弘明寺',
    rent: '8〜10万',
    highlight: '商店街No.1',
    access: '京急本線で横浜10分',
    features: ['十条に最も近い雰囲気の商店街', '大岡川の桜並木が美しい', '下町情緒あふれる街'],
    icon: '🌸',
    color: 'bg-pink-50 border-pink-200',
  },
  {
    name: '京成立石',
    rent: '9.6〜12万',
    highlight: '昭和レトロ',
    access: '京成押上線で都心30-40分',
    features: ['昭和の飲み屋街が残る', 'せんべろ文化の聖地', '再開発中のため要注意'],
    icon: '🍶',
    color: 'bg-orange-50 border-orange-200',
  },
]

// 全候補比較テーブル
const allAreas = [
  { name: '川越', rent: '6.5〜9万', access: '50-60分', shopping: '★★★★☆', safety: '◎', budget: '◎' },
  { name: '蕨', rent: '7〜9万', access: '37分', shopping: '★★☆☆☆', safety: '◎', budget: '◎' },
  { name: '弘明寺', rent: '8〜10万', access: '40分', shopping: '★★★★★', safety: '◎', budget: '○' },
  { name: '京成立石', rent: '9.6〜12万', access: '30-40分', shopping: '★★★★☆', safety: '○', budget: '○' },
  { name: '大山', rent: '13〜15万', access: '25-30分', shopping: '★★★☆☆', safety: '◎', budget: '△' },
  { name: '王子', rent: '10〜15万', access: '35-40分', shopping: '★★☆☆☆', safety: '△', budget: '△' },
  { name: '十条', rent: '16〜25万', access: '20分', shopping: '★★★★★', safety: '◎', budget: '×' },
  { name: '東十条', rent: '12〜15万', access: '35-40分', shopping: '★★★☆☆', safety: '◎', budget: '×' },
  { name: '赤羽', rent: '14〜18万', access: '25分', shopping: '★★☆☆☆', safety: '△', budget: '×' },
]

// 星評価を表示するヘルパー
function Stars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="text-accent-warm">
      {'★'.repeat(count)}
      <span className="text-text-sub/20">{'★'.repeat(max - count)}</span>
    </span>
  )
}

// 予算OK/NG表示
function BudgetBadge({ value }: { value: string }) {
  if (value === '×') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent">NG</span>
  if (value === '△') return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-warm/30 text-text">微妙</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/30 text-text">OK</span>
}

export default function TipsPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* 番外編の背景装飾 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)',
        }}
      />

      {/* ヘッダー */}
      <div className="relative px-4 pt-8 pb-6 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-warm/20 text-sm text-text-sub mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            番外編
          </div>
          <h1 className="text-2xl font-bold text-text">物件ヒント</h1>
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto space-y-6">

        {/* ===== 概要カード ===== */}
        <section className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-light/50 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-text mb-2">調査結果のまとめ</h2>
              <p className="text-sm text-text leading-relaxed">
                <span className="font-medium text-accent">2LDKで月額7〜9万円は東京23区内では厳しい。</span>
                埼玉・神奈川に視野を広げると選択肢が一気に増える。既存候補（十条・赤羽・大山等）の2LDK相場は12〜18万円で、予算の約2倍。
              </p>
            </div>
          </div>
        </section>

        {/* ===== 既存候補5エリアの実態 ===== */}
        <section className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-5">
          <h2 className="flex items-center gap-2 font-bold text-text mb-4">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            既存候補5エリアの実態
          </h2>

          {/* テーブル（スクロール可能） */}
          <div className="overflow-x-auto -mx-5 px-5 pb-2">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-primary-light/30">
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">エリア</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">2LDK相場</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">渋谷</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">商店街</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">治安</th>
                  <th className="text-left py-2 font-medium text-text-sub">7-9万</th>
                </tr>
              </thead>
              <tbody>
                {existingAreas.map((area) => (
                  <tr key={area.name} className="border-b border-primary-light/10">
                    <td className="py-2.5 pr-3 font-medium text-text">{area.name}</td>
                    <td className="py-2.5 pr-3 text-text">{area.rent}</td>
                    <td className="py-2.5 pr-3 text-text-sub">{area.access}</td>
                    <td className="py-2.5 pr-3">
                      <Stars count={area.shopping} />
                      {area.note && <span className="text-xs text-text-sub ml-1">({area.note})</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-text">{area.safety}</td>
                    <td className="py-2.5">
                      <BudgetBadge value={area.feasibility} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===== 予算内おすすめ4エリア ===== */}
        <section>
          <h2 className="flex items-center gap-2 font-bold text-text mb-4 px-1">
            <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            予算内おすすめ4エリア
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendedAreas.map((area) => (
              <div
                key={area.name}
                className={`rounded-2xl shadow-sm border p-5 ${area.color} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{area.icon}</span>
                  <div>
                    <h3 className="font-bold text-text">{area.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 text-text-sub font-medium">
                      {area.highlight}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-3.5 h-3.5 text-text-sub shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-text font-medium">{area.rent}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-3.5 h-3.5 text-text-sub shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-text-sub">{area.access}</span>
                  </div>
                </div>

                <ul className="space-y-1">
                  {area.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-text-sub">
                      <span className="text-success mt-0.5 shrink-0">-</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 目的別ベスト ===== */}
        <section className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-5">
          <h2 className="flex items-center gap-2 font-bold text-text mb-4">
            <svg className="w-5 h-5 text-accent-warm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            目的別ベスト
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-success/10 border border-success/20 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-sub">家賃最安</p>
                <p className="font-bold text-text">川越</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-sub">商店街重視</p>
                <p className="font-bold text-text">弘明寺</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-primary-light/30 border border-primary-light/50 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-primary-light/50 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-text-sub">アクセス重視</p>
                <p className="font-bold text-text">蕨</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 全候補比較テーブル ===== */}
        <section className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-5">
          <h2 className="flex items-center gap-2 font-bold text-text mb-4">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            全候補エリア比較
          </h2>

          <div className="overflow-x-auto -mx-5 px-5 pb-2">
            <table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr className="border-b border-primary-light/30">
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">エリア</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">2LDK相場</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">渋谷</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">商店街</th>
                  <th className="text-left py-2 pr-3 font-medium text-text-sub">治安</th>
                  <th className="text-left py-2 font-medium text-text-sub">予算</th>
                </tr>
              </thead>
              <tbody>
                {allAreas.map((area) => (
                  <tr key={area.name} className="border-b border-primary-light/10">
                    <td className="py-2.5 pr-3 font-medium text-text">{area.name}</td>
                    <td className="py-2.5 pr-3 text-text">{area.rent}</td>
                    <td className="py-2.5 pr-3 text-text-sub">{area.access}</td>
                    <td className="py-2.5 pr-3 text-accent-warm">{area.shopping}</td>
                    <td className="py-2.5 pr-3 text-text">{area.safety}</td>
                    <td className="py-2.5">
                      <BudgetBadge value={area.budget} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  )
}
