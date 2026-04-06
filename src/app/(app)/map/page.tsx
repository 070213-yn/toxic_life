// マップページ（サーバーコンポーネント）
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import MapPageClient from '@/components/map/MapPageClient'

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

// 目印ピンの型定義
export type CustomMarker = {
  id: string
  lat: number
  lng: number
  label: string
  color: 'blue' | 'green' | 'orange' | 'pink'
}

// マップ用のエリアデータ型
export type MapArea = {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  nearest_station: string | null
  visited_date: string | null
  scouting_photos: { id: string; storage_path: string; caption: string | null }[]
  scouting_ratings: { user_id: string; category: string; rating: number; profiles: { display_name: string; avatar_emoji: string } | { display_name: string; avatar_emoji: string }[] | null }[]
}

export default async function MapPage() {
  const supabase = await createClient()

  // 下見エリア一覧（写真・評価含む）
  const { data: areas } = await supabase
    .from('scouting_areas')
    .select(`
      id, name, latitude, longitude, nearest_station, visited_date,
      scouting_photos(id, storage_path, caption),
      scouting_ratings(user_id, category, rating, profiles:user_id(display_name, avatar_emoji))
    `)
    .order('visited_date', { ascending: false })

  // 実家の位置情報
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'home_locations')
    .single()

  const homeLocations: HomeLocations = (setting?.value as HomeLocations) || {}

  // 目印ピンの取得
  const { data: markersSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'custom_markers')
    .single()

  const customMarkers: CustomMarker[] = (markersSetting?.value as { markers: CustomMarker[] })?.markers || []

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-bg-card">
        <p className="text-text-sub text-sm">読み込み中...</p>
      </div>
    }>
      <MapPageClient
        areas={(areas as MapArea[]) || []}
        homeLocations={homeLocations}
        customMarkers={customMarkers}
      />
    </Suspense>
  )
}
