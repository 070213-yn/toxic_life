'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ナビゲーションのタブ定義
const tabs = [
  {
    label: 'ホーム',
    href: '/',
    // 家のアイコン
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: '貯金',
    href: '/savings',
    // コインのアイコン
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
        <path d="M12 6v2m0 8v2" />
      </svg>
    ),
  },
  {
    label: 'クエスト',
    href: '/quests',
    // チェックリストのアイコン
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: '下見',
    href: '/scouting',
    // 地図ピンのアイコン
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    label: 'カウントダウン',
    href: '/countdown',
    // カレンダーのアイコン
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M12 14l-2 2 2 2" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const pathname = usePathname()

  // 現在のパスに一致するかチェック（ホームは完全一致、他は前方一致）
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* モバイル: 画面下部の固定フッタータブ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg-card border-t border-primary-light/50 shadow-lg">
        <div className="flex justify-around items-center h-16 px-1">
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 ${
                  active
                    ? 'text-primary scale-105'
                    : 'text-text-sub hover:text-primary/70'
                }`}
              >
                <span className={active ? 'drop-shadow-sm' : ''}>{tab.icon}</span>
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* PC: 左サイドバー */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-56 flex-col bg-bg-card border-r border-primary-light/30 shadow-sm">
        {/* ロゴエリア */}
        <div className="px-5 py-6 border-b border-primary-light/30">
          <h1 className="text-lg font-bold text-primary font-[family-name:var(--font-quicksand)]">
            ふたりの旅路
          </h1>
          <p className="text-xs text-text-sub mt-0.5">同棲準備トラッカー</p>
        </div>

        {/* ナビゲーションリンク */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-primary-light/50 text-primary font-medium'
                    : 'text-text-sub hover:bg-primary-light/20 hover:text-primary/80'
                }`}
              >
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
