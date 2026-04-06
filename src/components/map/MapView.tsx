'use client'

// Google Maps地図コンポーネント
import { useCallback } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ScoutingArea } from '@/lib/types'
import type { HomeLocations } from '@/app/(app)/map/page'

type Props = {
  areas: Pick<ScoutingArea, 'id' | 'name' | 'latitude' | 'longitude'>[]
  homeLocations: HomeLocations
}

// 地図のスタイル（パステル調にカスタマイズ）
const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

// 関東圏の中心
const center = { lat: 35.68, lng: 139.76 }

export default function MapView({ areas, homeLocations }: Props) {
  const router = useRouter()
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [selectedHome, setSelectedHome] = useState<string | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const onLoad = useCallback((map: google.maps.Map) => {
    // エリアと実家の全ポイントが見えるようにフィット
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
  }, [areas, homeLocations])

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
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
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
                <div className="text-center min-w-[120px] p-1">
                  <p className="font-bold text-sm text-gray-800 mb-2">{area.name}</p>
                  <button
                    onClick={() => router.push(`/scouting/${area.id}`)}
                    className="inline-block px-3 py-1.5 text-xs bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                  >
                    下見メモを見る
                  </button>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )
      })}

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
  )
}
