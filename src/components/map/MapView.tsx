'use client'

// Leaflet地図コンポーネント（SSRなしでdynamic importされる）
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import type { ScoutingArea } from '@/lib/types'
import type { HomeLocations } from '@/app/(app)/map/page'

// 赤いピンアイコン（下見エリア用）
const redPinIcon = L.divIcon({
  html: '<div style="background:red;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

// 家アイコン（実家用）
const homeIcon = L.divIcon({
  html: '<div style="font-size:24px;line-height:1">🏠</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

type Props = {
  areas: Pick<ScoutingArea, 'id' | 'name' | 'latitude' | 'longitude'>[]
  homeLocations: HomeLocations
}

export default function MapView({ areas, homeLocations }: Props) {
  return (
    <MapContainer
      center={[35.68, 139.76]}
      zoom={10}
      className="h-full w-full"
      zoomControl={true}
    >
      {/* OpenStreetMapタイルレイヤー */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 下見エリアのマーカー（赤いピン） */}
      {areas.map((area) => {
        if (area.latitude == null || area.longitude == null) return null
        return (
          <Marker
            key={area.id}
            position={[area.latitude, area.longitude]}
            icon={redPinIcon}
          >
            <Popup>
              <div className="text-center min-w-[120px]">
                <p className="font-bold text-sm text-gray-800 mb-1">{area.name}</p>
                <Link
                  href={`/scouting/${area.id}`}
                  className="inline-block px-3 py-1 text-xs bg-primary/80 text-white rounded-full hover:bg-primary transition-colors"
                >
                  詳細を見る
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* しんごの実家マーカー */}
      {homeLocations.shingo && (
        <Marker
          position={[homeLocations.shingo.lat, homeLocations.shingo.lng]}
          icon={homeIcon}
        >
          <Popup>
            <div className="text-center">
              <p className="font-bold text-sm text-gray-800">
                {homeLocations.shingo.label || 'しんごの実家'}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* あいりの実家マーカー */}
      {homeLocations.airi && (
        <Marker
          position={[homeLocations.airi.lat, homeLocations.airi.lng]}
          icon={homeIcon}
        >
          <Popup>
            <div className="text-center">
              <p className="font-bold text-sm text-gray-800">
                {homeLocations.airi.label || 'あいりの実家'}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
