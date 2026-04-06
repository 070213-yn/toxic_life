'use client'

// マップページのメインクライアントコンポーネント
// ピン配置モード（pin_area_id クエリパラメータ）にも対応
// 右側にピン一覧サイドバー表示
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import MapView from './MapView'
import HomeLocationModal from './HomeLocationModal'
import type { ScoutingArea } from '@/lib/types'
import type { HomeLocations } from '@/app/(app)/map/page'

type AreaWithStation = Pick<ScoutingArea, 'id' | 'name' | 'latitude' | 'longitude' | 'nearest_station'>

type Props = {
  areas: AreaWithStation[]
  homeLocations: HomeLocations
}

export default function MapPageClient({ areas, homeLocations }: Props) {
  const [showHomeModal, setShowHomeModal] = useState(false)
  const [focusedAreaId, setFocusedAreaId] = useState<string | null>(null)
  // モバイル用: サイドバーの開閉
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchParams = useSearchParams()

  // ピン配置モード用: URLの pin_area_id パラメータを取得
  const pinAreaId = searchParams.get('pin_area_id')
  // ズーム対象: focus_area_id パラメータ
  const focusAreaId = searchParams.get('focus_area_id')

  // ピン配置対象のエリア名を取得
  const pinArea = pinAreaId ? areas.find((a) => a.id === pinAreaId) : null

  // ピンクリック: フォーカスしてサイドバーのハイライト更新
  const handlePinClick = (id: string) => {
    setFocusedAreaId(id)
  }

  // 実家クリック: 実家位置にフォーカス（homeKeyで判定）
  const handleHomeClick = (homeKey: 'shingo' | 'airi') => {
    const loc = homeLocations[homeKey]
    if (!loc) return
    // focusedAreaId に home-shingo / home-airi をセットして区別
    setFocusedAreaId(`home-${homeKey}`)
  }

  // 緯度経度が設定済みのエリア数
  const pinnedCount = areas.filter((a) => a.latitude != null && a.longitude != null).length

  return (
    <div className="relative h-[calc(100vh-5rem)] md:h-screen flex">
      {/* 地図エリア（flex-1で残りスペースを占有） */}
      <div className="relative flex-1">
        {/* Google Maps表示 */}
        <MapView
          areas={areas}
          homeLocations={homeLocations}
          pinAreaId={pinAreaId}
          pinAreaName={pinArea?.name || null}
          focusAreaId={focusAreaId}
          focusedAreaId={focusedAreaId}
        />

        {/* フロートコントロールパネル（右上） */}
        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
          {/* モバイル用: ピン一覧トグルボタン */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden flex items-center gap-2 px-3 py-2 bg-bg-card/90 backdrop-blur-sm rounded-xl shadow-md border border-primary-light/30 text-sm text-text hover:bg-bg-card transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            一覧
          </button>
          <button
            onClick={() => setShowHomeModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-bg-card/90 backdrop-blur-sm rounded-xl shadow-md border border-primary-light/30 text-sm text-text hover:bg-bg-card transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            実家を設定
          </button>
        </div>
      </div>

      {/* PC用: 右サイドバー（ピン一覧） */}
      <aside className="hidden md:flex flex-col w-72 bg-bg-card border-l border-primary-light/30 overflow-hidden">
        <SidebarContent
          areas={areas}
          homeLocations={homeLocations}
          pinnedCount={pinnedCount}
          focusedAreaId={focusedAreaId}
          onPinClick={handlePinClick}
          onHomeClick={handleHomeClick}
        />
      </aside>

      {/* モバイル用: スライドアップパネル */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[1100]">
          {/* オーバーレイ背景 */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          {/* パネル */}
          <div className="absolute bottom-0 left-0 right-0 bg-bg-card rounded-t-2xl shadow-lg max-h-[70vh] flex flex-col animate-slide-up">
            {/* ドラッグハンドル */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-primary-light/40 rounded-full" />
            </div>
            <SidebarContent
              areas={areas}
              homeLocations={homeLocations}
              pinnedCount={pinnedCount}
              focusedAreaId={focusedAreaId}
              onPinClick={(id) => { handlePinClick(id); setSidebarOpen(false) }}
              onHomeClick={(key) => { handleHomeClick(key); setSidebarOpen(false) }}
            />
          </div>
        </div>
      )}

      {/* 実家位置設定モーダル */}
      {showHomeModal && (
        <HomeLocationModal
          currentLocations={homeLocations}
          onClose={() => setShowHomeModal(false)}
        />
      )}
    </div>
  )
}

// サイドバーの中身（PC・モバイル共通）
function SidebarContent({
  areas,
  homeLocations,
  pinnedCount,
  focusedAreaId,
  onPinClick,
  onHomeClick,
}: {
  areas: AreaWithStation[]
  homeLocations: HomeLocations
  pinnedCount: number
  focusedAreaId: string | null
  onPinClick: (id: string) => void
  onHomeClick: (key: 'shingo' | 'airi') => void
}) {
  return (
    <>
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-primary-light/20">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text">ピン一覧</h2>
          <span className="text-xs text-text-sub bg-primary-light/20 px-2 py-0.5 rounded-full">
            {pinnedCount}/{areas.length} 件
          </span>
        </div>
      </div>

      {/* ピンリスト */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {/* 実家の項目 */}
        {homeLocations.shingo && (
          <button
            onClick={() => onHomeClick('shingo')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
              focusedAreaId === 'home-shingo' ? 'bg-primary-light/30' : 'hover:bg-primary-light/20'
            }`}
          >
            {/* 家アイコン */}
            <span className="shrink-0 w-6 h-6 flex items-center justify-center text-base">
              &#x1F3E0;
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text truncate">
                {homeLocations.shingo.label || 'しんごの実家'}
              </p>
            </div>
          </button>
        )}
        {homeLocations.airi && (
          <button
            onClick={() => onHomeClick('airi')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
              focusedAreaId === 'home-airi' ? 'bg-primary-light/30' : 'hover:bg-primary-light/20'
            }`}
          >
            <span className="shrink-0 w-6 h-6 flex items-center justify-center text-base">
              &#x1F3E0;
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text truncate">
                {homeLocations.airi.label || 'あいりの実家'}
              </p>
            </div>
          </button>
        )}

        {/* 区切り線（実家がある場合） */}
        {(homeLocations.shingo || homeLocations.airi) && areas.length > 0 && (
          <div className="border-b border-primary-light/15 my-1.5" />
        )}

        {/* 下見エリア一覧 */}
        {areas.map((area) => {
          const hasPinned = area.latitude != null && area.longitude != null
          return (
            <button
              key={area.id}
              onClick={() => hasPinned ? onPinClick(area.id) : undefined}
              disabled={!hasPinned}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                !hasPinned
                  ? 'opacity-50 cursor-default'
                  : focusedAreaId === area.id
                    ? 'bg-primary-light/30'
                    : 'hover:bg-primary-light/20'
              }`}
            >
              {/* 赤い丸アイコン */}
              <span className={`shrink-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                hasPinned ? 'bg-red-500' : 'bg-gray-300'
              }`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-text truncate">{area.name}</p>
                  {/* 未設定バッジ */}
                  {!hasPinned && (
                    <span className="shrink-0 text-[10px] text-text-sub bg-primary-light/20 px-1.5 py-0.5 rounded">
                      未設定
                    </span>
                  )}
                </div>
                {/* 最寄り駅 */}
                {area.nearest_station && (
                  <p className="text-xs text-text-sub truncate mt-0.5">
                    {area.nearest_station}
                  </p>
                )}
              </div>
            </button>
          )
        })}

        {/* エリアなし */}
        {areas.length === 0 && (
          <p className="text-xs text-text-sub text-center py-6">
            まだエリアがありません
          </p>
        )}
      </div>
    </>
  )
}
