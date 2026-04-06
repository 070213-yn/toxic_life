'use client'

// Google Maps地図コンポーネント
// 機能A: マップクリックで下見メモ作成
// 機能B: ピン配置モード（pin_area_id）、フォーカスモード（focus_area_id）
import { useCallback, useState, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF, StandaloneSearchBox } from '@react-google-maps/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { HomeLocations, MapArea } from '@/app/(app)/map/page'

type Props = {
  areas: MapArea[]
  homeLocations: HomeLocations
  pinAreaId?: string | null
  pinAreaName?: string | null
  focusAreaId?: string | null
  focusedAreaId?: string | null
  onPinPlaced?: () => void      // ピン配置完了時のコールバック
}

// useJsApiLoader の libraries は再レンダリングで参照が変わらないようにstatic定義
const LIBRARIES: ('places')[] = ['places']

// 地図のスタイル
const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

// 関東圏の中心
const defaultCenter = { lat: 35.68, lng: 139.76 }

export default function MapView({ areas, homeLocations, pinAreaId, pinAreaName, focusAreaId, focusedAreaId, onPinPlaced }: Props) {
  const router = useRouter()
  const mapRef = useRef<google.maps.Map | null>(null)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<string | null>(null)

  // 機能A: マップクリックで下見メモ作成
  const [clickedPos, setClickedPos] = useState<{ lat: number; lng: number } | null>(null)
  const [newAreaName, setNewAreaName] = useState('')
  const [newStation, setNewStation] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdAreaId, setCreatedAreaId] = useState<string | null>(null)

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

    // エリアへのフォーカス
    const area = areas.find((a) => a.id === focusedAreaId)
    if (area && area.latitude != null && area.longitude != null) {
      mapRef.current.panTo({ lat: area.latitude, lng: area.longitude })
      mapRef.current.setZoom(15)
      setSelectedArea(area.id)
      setSelectedHome(null)
    }
  }, [focusedAreaId, areas, homeLocations])

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

    if (hasPoints) {
      map.fitBounds(bounds, 60)
    }
  }, [areas, homeLocations, focusArea])

  // 地図クリックハンドラ
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat == null || lng == null) return

    // ピン配置モード
    if (pinAreaId && pinPlacing && !pinSaved) {
      setPinPos({ lat, lng })
      return
    }

    // 通常モード: 下見メモ作成フォームを表示
    if (!pinAreaId) {
      setClickedPos({ lat, lng })
      setNewAreaName('')
      setNewStation('')
      setCreatedAreaId(null)
      setSelectedArea(null)
      setSelectedHome(null)
    }
  }, [pinAreaId, pinPlacing, pinSaved])

  // 機能A: 新しい下見メモを作成
  const handleCreateArea = async () => {
    if (!newAreaName.trim() || !clickedPos) return
    setCreating(true)

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('scouting_areas')
      .insert({
        name: newAreaName.trim(),
        nearest_station: newStation.trim() || null,
        latitude: clickedPos.lat,
        longitude: clickedPos.lng,
        visited_date: today,
      })
      .select('id')
      .single()

    if (!error && data) {
      setCreatedAreaId(data.id)
      router.refresh()
    }
    setCreating(false)
  }

  // 機能B: ピン位置を保存
  const handlePinSave = async () => {
    if (!pinAreaId || !pinPos) return
    setPinSaving(true)

    const { error } = await supabase
      .from('scouting_areas')
      .update({ latitude: pinPos.lat, longitude: pinPos.lng })
      .eq('id', pinAreaId)

    if (!error) {
      setPinSaved(true)
      setPinPlacing(false)
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
          draggableCursor: (pinAreaId && pinPlacing && !pinSaved) ? 'crosshair' : undefined,
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
                          const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scouting-photos/${photo.storage_path}`
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
              onCloseClick={() => { setClickedPos(null); setCreatedAreaId(null) }}
            >
              <div className="min-w-[200px] p-1">
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
                ) : (
                  // 作成フォーム
                  <div>
                    <p className="text-xs font-bold text-gray-700 mb-2">この場所で下見メモを作成</p>
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
                      className="w-full px-3 py-1.5 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {creating ? '作成中...' : '作成'}
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
