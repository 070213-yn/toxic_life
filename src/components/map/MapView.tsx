'use client'

// Google Maps地図コンポーネント
// 機能A: マップクリックで下見メモ作成
// 機能B: ピン配置モード（pin_area_id）、フォーカスモード（focus_area_id）
import { useCallback, useState, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, StandaloneSearchBox } from '@react-google-maps/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase as supabaseClient } from '@/lib/supabase/client'
import { findRentData } from '@/lib/rent-data'
import type { HomeLocations, MapArea, CustomMarker } from '@/app/(app)/map/page'

// 目印ピンの色マッピング
const MARKER_COLORS: Record<string, string> = {
  blue: '#3B82F6',
  green: '#22C55E',
  orange: '#F97316',
  pink: '#EC4899',
}

// 色選択用の選択肢
const COLOR_OPTIONS: { value: CustomMarker['color']; label: string; hex: string }[] = [
  { value: 'blue', label: '青', hex: '#3B82F6' },
  { value: 'green', label: '緑', hex: '#22C55E' },
  { value: 'orange', label: 'オレンジ', hex: '#F97316' },
  { value: 'pink', label: 'ピンク', hex: '#EC4899' },
]

type Props = {
  areas: MapArea[]
  homeLocations: HomeLocations
  customMarkers: CustomMarker[]
  pinAreaId?: string | null
  pinAreaName?: string | null
  focusAreaId?: string | null
  focusedAreaId?: string | null
  onPinPlaced?: () => void
  homePlacing?: 'shingo' | 'airi' | null  // 実家ピン配置モード
  onHomePlaced?: () => void
}

// useJsApiLoader の libraries は再レンダリングで参照が変わらないようにstatic定義
const LIBRARIES: ('places')[] = ['places']

// アクセス情報の自動計算先
const ACCESS_DESTINATIONS = [
  { name: '新宿', query: '新宿駅' },
  { name: '横浜', query: '横浜駅' },
  { name: 'センター北', query: 'センター北駅' },
  { name: '辻堂', query: '辻堂駅' },
]

// 乗換時間を計算してDBに保存する
async function calcAndSaveAccessInfo(areaId: string, stationName: string) {
  if (!stationName) return

  const service = new google.maps.DistanceMatrixService()
  const destinations = ACCESS_DESTINATIONS.map((d) => d.query)

  try {
    const result = await service.getDistanceMatrix({
      origins: [`${stationName}駅`],
      destinations,
      travelMode: google.maps.TravelMode.TRANSIT,
      region: 'JP',
    })

    if (result.rows[0]) {
      const accessInfo: Record<string, string> = {}
      result.rows[0].elements.forEach((el, i) => {
        if (el.status === 'OK' && el.duration) {
          accessInfo[ACCESS_DESTINATIONS[i].name] = el.duration.text
        }
      })

      if (Object.keys(accessInfo).length > 0) {
        await supabaseClient.from('scouting_areas').update({ access_info: accessInfo }).eq('id', areaId)
      }
    }
  } catch (e) {
    console.error('アクセス情報の計算に失敗:', e)
  }
}

// 地図のスタイル
const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

// 関東圏の中心
const defaultCenter = { lat: 35.68, lng: 139.76 }

export default function MapView({ areas, homeLocations, customMarkers, pinAreaId, pinAreaName, focusAreaId, focusedAreaId, onPinPlaced, homePlacing, onHomePlaced }: Props) {
  const router = useRouter()
  const mapRef = useRef<google.maps.Map | null>(null)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<string | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  // 機能A: マップクリックで下見メモ作成
  const [clickedPos, setClickedPos] = useState<{ lat: number; lng: number } | null>(null)
  const [newAreaName, setNewAreaName] = useState('')
  const [newStation, setNewStation] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdAreaId, setCreatedAreaId] = useState<string | null>(null)

  // マップクリック時の選択肢モード: null=選択中, 'scouting'=下見メモ, 'marker'=目印
  const [clickMode, setClickMode] = useState<null | 'scouting' | 'marker'>(null)

  // 目印追加フォーム
  const [markerLabel, setMarkerLabel] = useState('')
  const [markerColor, setMarkerColor] = useState<CustomMarker['color']>('blue')
  const [markerSaving, setMarkerSaving] = useState(false)
  const [markerDeletingId, setMarkerDeletingId] = useState<string | null>(null)

  // 機能B: ピン配置モード
  const [pinPlacing, setPinPlacing] = useState(!!pinAreaId)
  const [pinPos, setPinPos] = useState<{ lat: number; lng: number } | null>(null)
  const [pinSaving, setPinSaving] = useState(false)
  const [pinSaved, setPinSaved] = useState(false)

  // pinAreaIdが変わったらピン配置モードをリセット
  useEffect(() => {
    if (pinAreaId) {
      setPinPlacing(true)
      setPinPos(null)
      setPinSaved(false)
    } else {
      setPinPlacing(false)
    }
  }, [pinAreaId])

  // 実家ピン配置モード
  const [homePos, setHomePos] = useState<{ lat: number; lng: number } | null>(null)
  const [homeSaving, setHomeSaving] = useState(false)
  const [homeSaved, setHomeSaved] = useState(false)

  useEffect(() => {
    if (homePlacing) {
      setHomePos(null)
      setHomeSaved(false)
    }
  }, [homePlacing])

  // 実家ピン保存
  const handleHomeSave = async () => {
    if (!homePlacing || !homePos) return
    setHomeSaving(true)
    const newLocations = { ...homeLocations }
    newLocations[homePlacing] = {
      lat: homePos.lat,
      lng: homePos.lng,
      label: homePlacing === 'shingo' ? 'しんごの実家' : 'あいりの実家',
    }
    await supabaseClient.from('settings').upsert({ key: 'home_locations', value: newLocations }, { onConflict: 'key' })
    setHomeSaving(false)
    setHomeSaved(true)
    router.refresh()
    onHomePlaced?.()
  }

  // 検索ボックス
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    language: 'ja',
    region: 'JP',
    libraries: LIBRARIES,
  })

  // サイドバーからのフォーカス: focusedAreaId が変わったらパン＆ズーム
  useEffect(() => {
    if (!focusedAreaId || !mapRef.current) return

    // 実家へのフォーカス
    if (focusedAreaId === 'home-shingo' && homeLocations.shingo) {
      mapRef.current.panTo({ lat: homeLocations.shingo.lat, lng: homeLocations.shingo.lng })
      mapRef.current.setZoom(15)
      setSelectedHome('shingo')
      setSelectedArea(null)
      return
    }
    if (focusedAreaId === 'home-airi' && homeLocations.airi) {
      mapRef.current.panTo({ lat: homeLocations.airi.lat, lng: homeLocations.airi.lng })
      mapRef.current.setZoom(15)
      setSelectedHome('airi')
      setSelectedArea(null)
      return
    }

    // 目印マーカーへのフォーカス
    if (focusedAreaId.startsWith('marker-')) {
      const markerId = focusedAreaId.replace('marker-', '')
      const marker = customMarkers.find((m) => m.id === markerId)
      if (marker) {
        mapRef.current.panTo({ lat: marker.lat, lng: marker.lng })
        mapRef.current.setZoom(15)
        setSelectedMarker(marker.id)
        setSelectedArea(null)
        setSelectedHome(null)
      }
      return
    }

    // エリアへのフォーカス
    const area = areas.find((a) => a.id === focusedAreaId)
    if (area && area.latitude != null && area.longitude != null) {
      mapRef.current.panTo({ lat: area.latitude, lng: area.longitude })
      mapRef.current.setZoom(15)
      setSelectedArea(area.id)
      setSelectedHome(null)
    }
  }, [focusedAreaId, areas, homeLocations, customMarkers])

  // 検索ボックスのハンドラ
  const onSearchLoad = (ref: google.maps.places.SearchBox) => {
    searchBoxRef.current = ref
  }

  const onPlacesChanged = () => {
    const places = searchBoxRef.current?.getPlaces()
    if (!places || places.length === 0) return
    const place = places[0]
    if (place.geometry?.location) {
      mapRef.current?.panTo(place.geometry.location)
      mapRef.current?.setZoom(15)
    }
  }

  // フォーカス対象のエリアを取得
  const focusArea = focusAreaId ? areas.find((a) => a.id === focusAreaId) : null

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map

    // フォーカスモード: 特定エリアにズームイン
    if (focusArea && focusArea.latitude != null && focusArea.longitude != null) {
      map.setCenter({ lat: focusArea.latitude, lng: focusArea.longitude })
      map.setZoom(15)
      // ズーム後にInfoWindowを開く
      setTimeout(() => setSelectedArea(focusArea.id), 500)
      return
    }

    // 通常モード: 全ポイントが見えるようにフィット
    const bounds = new google.maps.LatLngBounds()
    let hasPoints = false

    areas.forEach((area) => {
      if (area.latitude != null && area.longitude != null) {
        bounds.extend({ lat: area.latitude, lng: area.longitude })
        hasPoints = true
      }
    })

    if (homeLocations.shingo) {
      bounds.extend({ lat: homeLocations.shingo.lat, lng: homeLocations.shingo.lng })
      hasPoints = true
    }
    if (homeLocations.airi) {
      bounds.extend({ lat: homeLocations.airi.lat, lng: homeLocations.airi.lng })
      hasPoints = true
    }

    // 目印ピンもboundsに含める
    customMarkers.forEach((marker) => {
      bounds.extend({ lat: marker.lat, lng: marker.lng })
      hasPoints = true
    })

    if (hasPoints) {
      map.fitBounds(bounds, 60)
    }
  }, [areas, homeLocations, customMarkers, focusArea])

  // 地図クリックハンドラ
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat == null || lng == null) return

    // 実家ピン配置モード
    if (homePlacing && !homeSaved) {
      setHomePos({ lat, lng })
      return
    }

    // エリアピン配置モード
    if (pinAreaId && pinPlacing && !pinSaved) {
      setPinPos({ lat, lng })
      return
    }

    // 通常モード: 選択肢を表示（実家配置中は無視）
    if (!pinAreaId && !homePlacing) {
      // 一度nullにしてから設定（同じ場所クリックでも再表示されるように）
      setClickedPos(null)
      setTimeout(() => setClickedPos({ lat, lng }), 0)
      setClickMode(null) // 選択肢モードにリセット
      setNewAreaName('')
      setNewStation('')
      setCreatedAreaId(null)
      setMarkerLabel('')
      setMarkerColor('blue')
      setSelectedArea(null)
      setSelectedHome(null)
      setSelectedMarker(null)
    }
  }, [pinAreaId, pinPlacing, pinSaved, homePlacing, homeSaved])

  // 機能A: 新しい下見メモを作成
  const handleCreateArea = async () => {
    if (!newAreaName.trim() || !clickedPos) return
    setCreating(true)

    // 駅名から家賃相場を自動設定
    const rentMatch = newStation.trim() ? findRentData(newStation.trim()) : null
    const autoRentMemo = rentMatch ? `2LDK相場: ${rentMatch.data.rent}（データベース調べ）` : null

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabaseClient
      .from('scouting_areas')
      .insert({
        name: newAreaName.trim(),
        nearest_station: newStation.trim() || null,
        latitude: clickedPos.lat,
        longitude: clickedPos.lng,
        visited_date: today,
        rent_memo: autoRentMemo,
      })
      .select('id')
      .single()

    if (!error && data) {
      setCreatedAreaId(data.id)
      // アクセス情報を自動計算（最寄り駅があれば）
      if (newStation.trim()) {
        calcAndSaveAccessInfo(data.id, newStation.trim())
      }
      router.refresh()
    }
    setCreating(false)
  }

  // 目印ピンを追加
  const handleAddMarker = async () => {
    if (!markerLabel.trim() || !clickedPos) return
    setMarkerSaving(true)

    const newMarker: CustomMarker = {
      id: crypto.randomUUID(),
      lat: clickedPos.lat,
      lng: clickedPos.lng,
      label: markerLabel.trim(),
      color: markerColor,
    }

    // 既存の目印配列に追加
    const updatedMarkers = [...customMarkers, newMarker]

    await supabaseClient
      .from('settings')
      .upsert(
        { key: 'custom_markers', value: { markers: updatedMarkers } },
        { onConflict: 'key' }
      )

    setMarkerSaving(false)
    setClickedPos(null)
    setClickMode(null)
    router.refresh()
  }

  // 目印ピンを削除
  const handleDeleteMarker = async (markerId: string) => {
    setMarkerDeletingId(markerId)
    const updatedMarkers = customMarkers.filter((m) => m.id !== markerId)

    await supabaseClient
      .from('settings')
      .upsert(
        { key: 'custom_markers', value: { markers: updatedMarkers } },
        { onConflict: 'key' }
      )

    setMarkerDeletingId(null)
    setSelectedMarker(null)
    router.refresh()
  }

  // 機能B: ピン位置を保存
  const handlePinSave = async () => {
    if (!pinAreaId || !pinPos) return
    setPinSaving(true)

    const { error } = await supabaseClient
      .from('scouting_areas')
      .update({ latitude: pinPos.lat, longitude: pinPos.lng })
      .eq('id', pinAreaId)

    if (!error) {
      setPinSaved(true)
      setPinPlacing(false)
      // アクセス情報を自動計算（ピン配置対象のエリアの最寄り駅を使う）
      const targetArea = areas.find((a) => a.id === pinAreaId)
      const station = (targetArea as Record<string, unknown>)?.nearest_station as string | undefined
      if (station) {
        calcAndSaveAccessInfo(pinAreaId, station)
      }
      router.refresh()
      onPinPlaced?.()
    }
    setPinSaving(false)
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-card">
        <p className="text-accent text-sm">地図の読み込みに失敗しました</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-card">
        <p className="text-text-sub text-sm">地図を読み込み中...</p>
      </div>
    )
  }

  return (
    <>
      {/* 実家ピン配置バナー */}
      {homePlacing && !homeSaved && (
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-accent-warm/20 backdrop-blur-sm border-b border-accent-warm/30 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <span className="text-xl">🏠</span>
            <p className="text-sm font-medium text-text flex-1">
              <span className="font-bold">{homePlacing === 'shingo' ? 'しんご' : 'あいり'}の実家</span>の場所をクリックしてね
            </p>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {homePos && (
                <button onClick={handleHomeSave} disabled={homeSaving} className="px-4 py-1.5 bg-primary text-white text-sm rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {homeSaving ? '保存中...' : 'この場所で保存'}
                </button>
              )}
              <button onClick={() => onHomePlaced?.()} className="px-3 py-1.5 text-text-sub text-sm rounded-full hover:bg-white/50 transition-colors">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ピン配置モードのバナー */}
      {pinAreaId && pinPlacing && !pinSaved && (
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-primary-light/90 backdrop-blur-sm border-b border-primary/20 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {/* 地図アイコン */}
            <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-medium text-text flex-1">
              <span className="font-bold">{pinAreaName || 'エリア'}</span>のピンを配置してください。地図をクリックして場所を選んでね
            </p>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {pinPos && (
                <button
                  onClick={handlePinSave}
                  disabled={pinSaving}
                  className="px-4 py-1.5 bg-primary text-white text-sm rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {pinSaving ? '保存中...' : 'この場所で保存'}
                </button>
              )}
              <button
                onClick={() => { setPinPlacing(false); setPinPos(null); onPinPlaced?.() }}
                className="px-3 py-1.5 text-text-sub text-sm rounded-full hover:bg-white/50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ピン保存完了バナー */}
      {pinAreaId && pinSaved && (
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-success/10 backdrop-blur-sm border-b border-success/20 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <svg className="w-5 h-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-text">
              ピンを保存しました！
            </p>
            <Link
              href={`/scouting/${pinAreaId}`}
              className="ml-auto shrink-0 px-4 py-1.5 bg-primary text-white text-sm rounded-full hover:bg-primary/90 transition-colors"
            >
              下見メモに戻る
            </Link>
          </div>
        </div>
      )}

      {/* 検索ボックス（左上にフロート） */}
      <div className="absolute top-4 left-4 z-[1001]">
        <StandaloneSearchBox onLoad={onSearchLoad} onPlacesChanged={onPlacesChanged}>
          <div className="relative">
            {/* 虫眼鏡アイコン */}
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="場所を検索..."
              className="w-[280px] bg-white rounded-xl shadow-md pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
            />
          </div>
        </StandaloneSearchBox>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onClick={handleMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          // ピン配置モード中はクロスヘアカーソル
          draggableCursor: ((pinAreaId && pinPlacing && !pinSaved) || (homePlacing && !homeSaved)) ? 'crosshair' : undefined,
        }}
      >
        {/* 下見エリアのマーカー（赤いピン） */}
        {areas.map((area) => {
          if (area.latitude == null || area.longitude == null) return null
          return (
            <MarkerF
              key={area.id}
              position={{ lat: area.latitude, lng: area.longitude }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#EF4444',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
              onClick={() => setSelectedArea(area.id)}
            >
              {selectedArea === area.id && (
                <InfoWindowF
                  position={{ lat: area.latitude, lng: area.longitude }}
                  onCloseClick={() => setSelectedArea(null)}
                >
                  <div className="min-w-[260px] max-w-[320px] p-1">
                    {/* エリア名 + 訪問日 */}
                    <p className="font-bold text-sm text-gray-800">{area.name}</p>
                    {area.visited_date && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(area.visited_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    )}

                    {/* 写真横スクロール */}
                    {area.scouting_photos && area.scouting_photos.length > 0 && (
                      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                        {area.scouting_photos.slice(0, 6).map((photo) => {
                          const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/render/image/public/scouting-photos/${photo.storage_path}?width=128&height=128&resize=cover`
                          return (
                            <img
                              key={photo.id}
                              src={url}
                              alt={photo.caption || ''}
                              className="w-16 h-16 rounded-lg object-cover shrink-0"
                            />
                          )
                        })}
                      </div>
                    )}

                    {/* ユーザー別評価 */}
                    {area.scouting_ratings && area.scouting_ratings.length > 0 && (() => {
                      const byUser: Record<string, { name: string; emoji: string; ratings: number[] }> = {}
                      for (const r of area.scouting_ratings) {
                        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
                        if (!byUser[r.user_id]) {
                          byUser[r.user_id] = { name: p?.display_name || '?', emoji: p?.avatar_emoji || '', ratings: [] }
                        }
                        byUser[r.user_id].ratings.push(r.rating)
                      }
                      const users = Object.values(byUser)
                      return (
                        <div className="mt-2 space-y-1">
                          {users.map((u, i) => {
                            const avg = (u.ratings.reduce((a, b) => a + b, 0) / u.ratings.length).toFixed(1)
                            const isImg = u.emoji && (u.emoji.startsWith('http') || u.emoji.startsWith('/'))
                            return (
                              <div key={i} className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                                  {isImg ? <img src={u.emoji} alt="" className="w-full h-full object-cover" /> : <span style={{ fontSize: 9 }}>{u.emoji || '👤'}</span>}
                                </div>
                                <span className="text-xs text-gray-600">{u.name}</span>
                                <span className="text-xs text-yellow-500 ml-auto">★ {avg}</span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* 下見メモへのリンク */}
                    <button
                      onClick={() => router.push(`/scouting/${area.id}`)}
                      className="mt-2 w-full px-3 py-1.5 text-xs bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                    >
                      下見メモを見る
                    </button>
                  </div>
                </InfoWindowF>
              )}
            </MarkerF>
          )
        })}

        {/* 実家の仮ピン（配置モード中） */}
        {homePos && homePlacing && !homeSaved && (
          <MarkerF
            position={homePos}
            label={{ text: '\u{1F3E0}', fontSize: '28px', className: '' }}
            icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 0 }}
          />
        )}

        {/* 機能A: クリックした仮ピン（青い点） */}
        {clickedPos && !pinAreaId && (
          <MarkerF
            position={clickedPos}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3B82F6',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          >
            <InfoWindowF
              position={clickedPos}
              onCloseClick={() => { setClickedPos(null); setCreatedAreaId(null); setClickMode(null) }}
            >
              <div className="min-w-[220px] p-1">
                {createdAreaId ? (
                  // 作成完了後の表示
                  <div className="text-center">
                    <p className="text-sm font-bold text-green-600 mb-2">作成しました！</p>
                    <button
                      onClick={() => router.push(`/scouting/${createdAreaId}`)}
                      className="inline-block px-3 py-1.5 text-xs bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                    >
                      下見メモを開く
                    </button>
                  </div>
                ) : clickMode === null ? (
                  // 選択肢モード
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-2.5">この場所に...</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setClickMode('scouting')}
                        className="flex-1 px-3 py-2 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                      >
                        下見メモを作成
                      </button>
                      <button
                        onClick={() => setClickMode('marker')}
                        className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        目印を追加
                      </button>
                    </div>
                  </div>
                ) : clickMode === 'scouting' ? (
                  // 下見メモ作成フォーム
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <button onClick={() => setClickMode(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                      </button>
                      <p className="text-xs font-bold text-gray-700">下見メモを作成</p>
                    </div>
                    <input
                      type="text"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      placeholder="エリア名（必須）"
                      className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateArea() }}
                    />
                    <input
                      type="text"
                      value={newStation}
                      onChange={(e) => setNewStation(e.target.value)}
                      placeholder="最寄り駅（任意）"
                      className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateArea() }}
                    />
                    <button
                      onClick={handleCreateArea}
                      disabled={creating || !newAreaName.trim()}
                      className="w-full px-3 py-1.5 text-xs bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {creating ? '作成中...' : '作成'}
                    </button>
                  </div>
                ) : (
                  // 目印追加フォーム
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <button onClick={() => setClickMode(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                      </button>
                      <p className="text-xs font-bold text-gray-700">目印を追加</p>
                    </div>
                    <input
                      type="text"
                      value={markerLabel}
                      onChange={(e) => setMarkerLabel(e.target.value)}
                      placeholder="ラベル名（必須）"
                      className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddMarker() }}
                    />
                    {/* 色選択 */}
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="text-xs text-gray-500">色:</span>
                      {COLOR_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setMarkerColor(opt.value)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            markerColor === opt.value ? 'border-gray-700 scale-110' : 'border-transparent hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: opt.hex }}
                          title={opt.label}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleAddMarker}
                      disabled={markerSaving || !markerLabel.trim()}
                      className="w-full px-3 py-1.5 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {markerSaving ? '追加中...' : '追加'}
                    </button>
                  </div>
                )}
              </div>
            </InfoWindowF>
          </MarkerF>
        )}

        {/* 機能B: ピン配置モードの仮ピン（青い点） */}
        {pinAreaId && pinPos && !pinSaved && (
          <MarkerF
            position={pinPos}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3B82F6',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            }}
          />
        )}

        {/* 目印ピン */}
        {customMarkers.map((marker) => (
          <MarkerF
            key={`marker-${marker.id}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: MARKER_COLORS[marker.color] || MARKER_COLORS.blue,
              fillOpacity: 0.85,
              strokeColor: '#ffffff',
              strokeWeight: 1.5,
            }}
            onClick={() => { setSelectedMarker(marker.id); setSelectedArea(null); setSelectedHome(null) }}
          >
            {selectedMarker === marker.id && (
              <InfoWindowF
                position={{ lat: marker.lat, lng: marker.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="min-w-[140px] p-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: MARKER_COLORS[marker.color] || MARKER_COLORS.blue }}
                    />
                    <p className="font-bold text-sm text-gray-800">{marker.label}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteMarker(marker.id)}
                    disabled={markerDeletingId === marker.id}
                    className="w-full px-3 py-1 text-xs text-red-500 border border-red-200 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {markerDeletingId === marker.id ? '削除中...' : '削除'}
                  </button>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        ))}

        {/* しんごの実家 */}
        {homeLocations.shingo && (
          <MarkerF
            position={{ lat: homeLocations.shingo.lat, lng: homeLocations.shingo.lng }}
            label={{
              text: '\u{1F3E0}',
              fontSize: '24px',
              className: 'google-maps-emoji-label',
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0,
            }}
            onClick={() => setSelectedHome('shingo')}
          >
            {selectedHome === 'shingo' && (
              <InfoWindowF
                position={{ lat: homeLocations.shingo.lat, lng: homeLocations.shingo.lng }}
                onCloseClick={() => setSelectedHome(null)}
              >
                <div className="text-center p-1">
                  <p className="font-bold text-sm text-gray-800">
                    {homeLocations.shingo.label || 'しんごの実家'}
                  </p>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )}

        {/* あいりの実家 */}
        {homeLocations.airi && (
          <MarkerF
            position={{ lat: homeLocations.airi.lat, lng: homeLocations.airi.lng }}
            label={{
              text: '\u{1F3E0}',
              fontSize: '24px',
              className: 'google-maps-emoji-label',
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0,
            }}
            onClick={() => setSelectedHome('airi')}
          >
            {selectedHome === 'airi' && (
              <InfoWindowF
                position={{ lat: homeLocations.airi.lat, lng: homeLocations.airi.lng }}
                onCloseClick={() => setSelectedHome(null)}
              >
                <div className="text-center p-1">
                  <p className="font-bold text-sm text-gray-800">
                    {homeLocations.airi.label || 'あいりの実家'}
                  </p>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )}
      </GoogleMap>
    </>
  )
}
