// マップページ（サーバーコンポーネント）
// scouting_areas テーブルから全エリア、settingsテーブルから実家位置を取得
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import MapPageClient from '@/components/map/MapPageClient'
import type { ScoutingArea } from '@/lib/types'

// 実家位置の型定義
type HomeLocation = {
  lat: number
  lng: number
  label: string
}

export type HomeLocations = {
  shingo?: HomeLocation
  airi?: HomeLocation
}

export default async function MapPage() {
  const supabase = await createClient()

  // 下見エリア一覧を取得（位置情報の有無にかかわらず全エリア取得）
  const { data: areas } = await supabase
    .from('scouting_areas')
    .select('id, name, latitude, longitude, nearest_station')

  // 実家の位置情報をsettingsテーブルから取得
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'home_locations')
    .single()

  const homeLocations: HomeLocations = (setting?.value as HomeLocations) || {}

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-bg-card">
        <p className="text-text-sub text-sm">読み込み中...</p>
      </div>
    }>
      <MapPageClient
        areas={(areas as Pick<ScoutingArea, 'id' | 'name' | 'latitude' | 'longitude' | 'nearest_station'>[]) || []}
        homeLocations={homeLocations}
      />
    </Suspense>
  )
}
