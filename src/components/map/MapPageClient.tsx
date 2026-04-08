'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

// リアルタイム監視対象テーブル（マップページ用）
import MapView from './MapView'
import HomeLocationModal from './HomeLocationModal'
import type { HomeLocations, MapArea, CustomMarker } from '@/app/(app)/map/page'
import { playSound } from '@/lib/sounds'

// 目印ピンの色マッピング
const MARKER_COLORS: Record<string, string> = {
  blue: '#3B82F6',
  green: '#22C55E',
  orange: '#F97316',
  pink: '#EC4899',
}

type Props = {
  areas: MapArea[]
  homeLocations: HomeLocations
  customMarkers: CustomMarker[]
}

// profilesヘルパー（配列 or オブジェクトに対応）
function getProfile(profiles: { display_name: string; avatar_emoji: string } | { display_name: string; avatar_emoji: string }[] | null) {
  if (!profiles) return null
  if (Array.isArray(profiles)) return profiles[0] || null
  return profiles
}

// ユーザー別の平均評価を計算
function getUserRatings(area: MapArea) {
  const byUser: Record<string, { name: string; emoji: string; ratings: number[] }> = {}
  for (const r of area.scouting_ratings || []) {
    const p = getProfile(r.profiles)
    if (!byUser[r.user_id]) {
      byUser[r.user_id] = {
        name: p?.display_name || '?',
        emoji: p?.avatar_emoji || '',
        ratings: [],
      }
    }
    byUser[r.user_id].ratings.push(r.rating)
  }
  return Object.values(byUser).map((u) => ({
    ...u,
    avg: u.ratings.length > 0 ? (u.ratings.reduce((a, b) => a + b, 0) / u.ratings.length).toFixed(1) : '-',
  }))
}

// アバター表示
function Avatar({ emoji, size = 20 }: { emoji: string; size?: number }) {
  const isImage = emoji && (emoji.startsWith('http') || emoji.startsWith('/'))
  return (
    <div className="rounded-full bg-primary-light/30 flex items-center justify-center overflow-hidden shrink-0" style={{ width: size, height: size }}>
      {isImage ? <img src={emoji} alt="" className="w-full h-full object-cover" /> : <span style={{ fontSize: size * 0.55 }}>{emoji || '👤'}</span>}
    </div>
  )
}

export default function MapPageClient({ areas, homeLocations, customMarkers }: Props) {
  const [showHomeModal, setShowHomeModal] = useState(false)
  const [focusedAreaId, setFocusedAreaId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPinAreaId, setSidebarPinAreaId] = useState<string | null>(null)
  // 実家ピン配置モード
  const [homePlacing, setHomePlacing] = useState<'shingo' | 'airi' | null>(null)
  const searchParams = useSearchParams()

  const urlPinAreaId = searchParams.get('pin_area_id')
  const pinAreaId = sidebarPinAreaId || urlPinAreaId
  const focusAreaId = searchParams.get('focus_area_id')
  const pinArea = pinAreaId ? areas.find((a) => a.id === pinAreaId) : null

  const handlePinClick = (id: string) => { playSound('focus'); setFocusedAreaId(id) }
  const handleUnpinnedClick = (id: string) => { setSidebarPinAreaId(id); setSidebarOpen(false) }
  const handlePinPlaced = () => setSidebarPinAreaId(null)
  const handleHomeClick = (homeKey: 'shingo' | 'airi') => {
    if (homeLocations[homeKey]) { playSound('focus'); setFocusedAreaId(`home-${homeKey}`) }
  }
  const handleHomePlaced = () => setHomePlacing(null)

  const pinnedCount = areas.filter((a) => a.latitude != null && a.longitude != null).length

  return (
    <div className="relative h-[calc(100vh-5rem)] md:h-screen flex">
      <div className="relative flex-1">
        <MapView
          areas={areas}
          homeLocations={homeLocations}
          customMarkers={customMarkers}
          pinAreaId={pinAreaId}
          pinAreaName={pinArea?.name || null}
          focusAreaId={focusAreaId}
          focusedAreaId={focusedAreaId}
          onPinPlaced={handlePinPlaced}
          homePlacing={homePlacing}
          onHomePlaced={handleHomePlaced}
        />
        {/* ボタン群: モバイルでは検索ボックスと被らないよう下に配置 */}
        <div className="absolute top-16 right-2 md:top-4 md:right-4 z-[1000] flex gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden flex items-center gap-1.5 px-2.5 py-2 bg-bg-card/90 backdrop-blur-sm rounded-xl shadow-md border border-primary-light/30 text-xs text-text hover:bg-bg-card transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            一覧
          </button>
          <button onClick={() => setShowHomeModal(true)} className="flex items-center gap-1.5 px-2.5 py-2 bg-bg-card/90 backdrop-blur-sm rounded-xl shadow-md border border-primary-light/30 text-xs md:text-sm text-text hover:bg-bg-card transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            <span className="hidden sm:inline">実家を設定</span>
            <span className="sm:hidden">実家</span>
          </button>
        </div>
      </div>

      {/* PC: 右サイドバー */}
      <aside className="hidden md:flex flex-col w-80 bg-bg-card border-l border-primary-light/30 overflow-hidden">
        <SidebarContent areas={areas} homeLocations={homeLocations} customMarkers={customMarkers} pinnedCount={pinnedCount} focusedAreaId={focusedAreaId} onPinClick={handlePinClick} onHomeClick={handleHomeClick} onUnpinnedClick={handleUnpinnedClick} onMarkerClick={(m) => setFocusedAreaId(`marker-${m.id}`)} />
      </aside>

      {/* モバイル: スライドアップ */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[1100]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-bg-card rounded-t-2xl shadow-lg max-h-[70vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-primary-light/40 rounded-full" /></div>
            <SidebarContent areas={areas} homeLocations={homeLocations} customMarkers={customMarkers} pinnedCount={pinnedCount} focusedAreaId={focusedAreaId} onPinClick={(id) => { handlePinClick(id); setSidebarOpen(false) }} onHomeClick={(key) => { handleHomeClick(key); setSidebarOpen(false) }} onUnpinnedClick={(id) => { handleUnpinnedClick(id); setSidebarOpen(false) }} onMarkerClick={(m) => { setFocusedAreaId(`marker-${m.id}`); setSidebarOpen(false) }} />
          </div>
        </div>
      )}

      {showHomeModal && <HomeLocationModal currentLocations={homeLocations} onClose={() => setShowHomeModal(false)} onStartPlacing={(who) => setHomePlacing(who)} />}
    </div>
  )
}

// サイドバー
function SidebarContent({ areas, homeLocations, customMarkers, pinnedCount, focusedAreaId, onPinClick, onHomeClick, onUnpinnedClick, onMarkerClick }: {
  areas: MapArea[]; homeLocations: HomeLocations; customMarkers: CustomMarker[]; pinnedCount: number; focusedAreaId: string | null
  onPinClick: (id: string) => void; onHomeClick: (key: 'shingo' | 'airi') => void; onUnpinnedClick: (id: string) => void; onMarkerClick: (marker: CustomMarker) => void
}) {
  return (
    <>
      <div className="px-4 py-3 border-b border-primary-light/20">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text">ピン一覧</h2>
          <span className="text-xs text-text-sub bg-primary-light/20 px-2 py-0.5 rounded-full">{pinnedCount}/{areas.length} 件</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {/* 実家 */}
        {homeLocations.shingo && (
          <button onClick={() => onHomeClick('shingo')} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${focusedAreaId === 'home-shingo' ? 'bg-primary-light/30' : 'hover:bg-primary-light/20'}`}>
            <span className="shrink-0 text-base">🏠</span>
            <p className="text-sm font-medium text-text truncate">{homeLocations.shingo.label || 'しんごの実家'}</p>
          </button>
        )}
        {homeLocations.airi && (
          <button onClick={() => onHomeClick('airi')} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${focusedAreaId === 'home-airi' ? 'bg-primary-light/30' : 'hover:bg-primary-light/20'}`}>
            <span className="shrink-0 text-base">🏠</span>
            <p className="text-sm font-medium text-text truncate">{homeLocations.airi.label || 'あいりの実家'}</p>
          </button>
        )}

        {(homeLocations.shingo || homeLocations.airi) && areas.length > 0 && (
          <div className="border-b border-primary-light/15 my-1.5" />
        )}

        {/* エリア一覧 */}
        {areas.map((area) => {
          const hasPinned = area.latitude != null && area.longitude != null
          const userRatings = getUserRatings(area)

          return (
            <button
              key={area.id}
              onClick={() => hasPinned ? onPinClick(area.id) : onUnpinnedClick(area.id)}
              className={`w-full px-3 py-2.5 rounded-lg text-left transition-colors ${
                !hasPinned ? 'opacity-60 hover:bg-accent/10 hover:opacity-100'
                : focusedAreaId === area.id ? 'bg-primary-light/30' : 'hover:bg-primary-light/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`shrink-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ${hasPinned ? 'bg-red-500' : 'bg-gray-300'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-text truncate">{area.name}</p>
                    {!hasPinned && <span className="shrink-0 text-[10px] text-white bg-accent px-1.5 py-0.5 rounded">ピンを設定</span>}
                  </div>
                  {/* 訪問日 */}
                  {area.visited_date && (
                    <p className="text-[11px] text-text-sub mt-0.5">
                      {new Date(area.visited_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              {/* ユーザー別評価 */}
              {userRatings.length > 0 && (
                <div className="mt-1.5 pl-5 space-y-0.5">
                  {userRatings.map((u, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Avatar emoji={u.emoji} size={16} />
                      <span className="text-[11px] text-text-sub">{u.name}</span>
                      <div className="flex items-center gap-0.5 ml-auto">
                        <svg className="w-3 h-3 text-accent-warm" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-[11px] font-medium text-text">{u.avg}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}

        {areas.length === 0 && <p className="text-xs text-text-sub text-center py-6">まだエリアがありません</p>}

        {/* 目印セクション */}
        {(areas.length > 0 || homeLocations.shingo || homeLocations.airi) && customMarkers.length > 0 && (
          <div className="border-b border-primary-light/15 my-1.5" />
        )}

        {customMarkers.length > 0 && (
          <>
            <div className="px-1 pt-1 pb-0.5">
              <p className="text-xs font-bold text-text-sub">目印</p>
            </div>
            {customMarkers.map((marker) => (
              <button
                key={marker.id}
                onClick={() => onMarkerClick(marker)}
                className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                  focusedAreaId === `marker-${marker.id}` ? 'bg-primary-light/30' : 'hover:bg-primary-light/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="shrink-0 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: MARKER_COLORS[marker.color] || MARKER_COLORS.blue }}
                  />
                  <p className="text-sm text-text truncate flex-1">{marker.label}</p>
                  {/* URLがある場合はリンクアイコン表示 */}
                  {marker.url && (
                    <svg className="w-3.5 h-3.5 text-text-sub/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
                    </svg>
                  )}
                </div>
                {/* メモがある場合は1行プレビュー */}
                {marker.memo && (
                  <p className="text-[11px] text-text-sub/70 truncate mt-0.5 pl-5">{marker.memo}</p>
                )}
              </button>
            ))}
          </>
        )}

        {/* 目印追加のヒント */}
        <div className="px-3 pt-2 pb-1">
          <p className="text-[11px] text-text-sub/60 text-center">地図をクリックして目印を追加できます</p>
        </div>
      </div>
    </>
  )
}
