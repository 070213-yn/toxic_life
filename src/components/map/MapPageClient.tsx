'use client'

// マップページのメインクライアントコンポーネント
// ピン配置モード（pin_area_id クエリパラメータ）にも対応
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import MapView from './MapView'
import HomeLocationModal from './HomeLocationModal'
import type { ScoutingArea } from '@/lib/types'
import type { HomeLocations } from '@/app/(app)/map/page'

type Props = {
  areas: Pick<ScoutingArea, 'id' | 'name' | 'latitude' | 'longitude'>[]
  homeLocations: HomeLocations
}

export default function MapPageClient({ areas, homeLocations }: Props) {
  const [showHomeModal, setShowHomeModal] = useState(false)
  const searchParams = useSearchParams()

  // ピン配置モード用: URLの pin_area_id パラメータを取得
  const pinAreaId = searchParams.get('pin_area_id')
  // ズーム対象: focus_area_id パラメータ
  const focusAreaId = searchParams.get('focus_area_id')

  // ピン配置対象のエリア名を取得
  const pinArea = pinAreaId ? areas.find((a) => a.id === pinAreaId) : null

  return (
    <div className="relative h-[calc(100vh-5rem)] md:h-screen">
      {/* Google Maps表示 */}
      <MapView
        areas={areas}
        homeLocations={homeLocations}
        pinAreaId={pinAreaId}
        pinAreaName={pinArea?.name || null}
        focusAreaId={focusAreaId}
      />

      {/* フロートコントロールパネル（右上） */}
      <div className="absolute top-4 right-4 z-[1000]">
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
