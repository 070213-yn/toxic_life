'use client'

// 実家の位置設定モーダル
// settingsテーブルにkey='home_locations'で保存する
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { HomeLocations } from '@/app/(app)/map/page'

type Props = {
  currentLocations: HomeLocations
  onClose: () => void
}

export default function HomeLocationModal({ currentLocations, onClose }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // フォーム状態（既存データがあれば初期値として設定）
  const [shingoLat, setShingoLat] = useState(
    currentLocations.shingo?.lat?.toString() || ''
  )
  const [shingoLng, setShingoLng] = useState(
    currentLocations.shingo?.lng?.toString() || ''
  )
  const [shingoLabel, setShingoLabel] = useState(
    currentLocations.shingo?.label || 'しんごの実家'
  )
  const [airiLat, setAiriLat] = useState(
    currentLocations.airi?.lat?.toString() || ''
  )
  const [airiLng, setAiriLng] = useState(
    currentLocations.airi?.lng?.toString() || ''
  )
  const [airiLabel, setAiriLabel] = useState(
    currentLocations.airi?.label || 'あいりの実家'
  )

  // 保存処理
  const handleSave = async () => {
    setSaving(true)

    // 値を組み立て（空欄の場合はその人のデータを含めない）
    const value: HomeLocations = {}
    if (shingoLat && shingoLng) {
      value.shingo = {
        lat: parseFloat(shingoLat),
        lng: parseFloat(shingoLng),
        label: shingoLabel || 'しんごの実家',
      }
    }
    if (airiLat && airiLng) {
      value.airi = {
        lat: parseFloat(airiLat),
        lng: parseFloat(airiLng),
        label: airiLabel || 'あいりの実家',
      }
    }

    // settingsテーブルにupsert（key='home_locations'が既にあれば更新）
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: 'home_locations', value },
        { onConflict: 'key' }
      )

    setSaving(false)

    if (error) {
      alert('保存に失敗しました: ' + error.message)
      return
    }

    // ページを再取得して地図を更新
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* モーダル本体 */}
      <div className="relative bg-bg-card rounded-2xl shadow-xl w-full max-w-md p-6 border border-primary-light/30">
        <h2 className="text-lg font-bold text-text mb-4">実家の位置を設定</h2>

        {/* しんごの実家 */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-primary mb-2">しんごの実家</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-text-sub mb-1">ラベル</label>
              <input
                type="text"
                value={shingoLabel}
                onChange={(e) => setShingoLabel(e.target.value)}
                placeholder="しんごの実家"
                className="w-full px-3 py-2 rounded-lg border border-primary-light/30 bg-white/80 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-text-sub mb-1">緯度（例: 35.68）</label>
                <input
                  type="number"
                  step="any"
                  value={shingoLat}
                  onChange={(e) => setShingoLat(e.target.value)}
                  placeholder="35.68"
                  className="w-full px-3 py-2 rounded-lg border border-primary-light/30 bg-white/80 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs text-text-sub mb-1">経度（例: 139.76）</label>
                <input
                  type="number"
                  step="any"
                  value={shingoLng}
                  onChange={(e) => setShingoLng(e.target.value)}
                  placeholder="139.76"
                  className="w-full px-3 py-2 rounded-lg border border-primary-light/30 bg-white/80 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* あいりの実家 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-primary mb-2">あいりの実家</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-text-sub mb-1">ラベル</label>
              <input
                type="text"
                value={airiLabel}
                onChange={(e) => setAiriLabel(e.target.value)}
                placeholder="あいりの実家"
                className="w-full px-3 py-2 rounded-lg border border-primary-light/30 bg-white/80 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-text-sub mb-1">緯度（例: 35.68）</label>
                <input
                  type="number"
                  step="any"
                  value={airiLat}
                  onChange={(e) => setAiriLat(e.target.value)}
                  placeholder="35.68"
                  className="w-full px-3 py-2 rounded-lg border border-primary-light/30 bg-white/80 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs text-text-sub mb-1">経度（例: 139.76）</label>
                <input
                  type="number"
                  step="any"
                  value={airiLng}
                  onChange={(e) => setAiriLng(e.target.value)}
                  placeholder="139.76"
                  className="w-full px-3 py-2 rounded-lg border border-primary-light/30 bg-white/80 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ボタン群 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-primary-light/30 text-sm text-text-sub hover:bg-primary-light/20 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
