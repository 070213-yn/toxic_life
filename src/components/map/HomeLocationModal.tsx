'use client'

// 実家の位置設定モーダル
// 「マップをクリックして場所を選ぶ」方式
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { HomeLocations } from '@/app/(app)/map/page'

type Props = {
  currentLocations: HomeLocations
  onClose: () => void
  onStartPlacing: (who: 'shingo' | 'airi') => void
}

export default function HomeLocationModal({ currentLocations, onClose, onStartPlacing }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // 実家のPINを削除
  const handleRemove = async (who: 'shingo' | 'airi') => {
    setSaving(true)
    const value = { ...currentLocations }
    delete value[who]
    await supabase.from('settings').upsert({ key: 'home_locations', value }, { onConflict: 'key' })
    setSaving(false)
    router.refresh()
  }

  const shingoSet = !!currentLocations.shingo
  const airiSet = !!currentLocations.airi

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-bg-card rounded-2xl shadow-xl w-full max-w-sm mx-4 border border-primary-light/30">
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary-light/30">
          <h2 className="text-base font-bold text-text">実家の位置を設定</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-text-sub hover:text-text transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-text-sub">マップをクリックして場所を選んでね</p>

          {/* しんごの実家 */}
          <div className="rounded-xl border border-primary-light/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <span className="text-sm font-medium text-text">しんごの実家</span>
              </div>
              {shingoSet && (
                <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full">設定済み</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { onClose(); onStartPlacing('shingo') }}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                {shingoSet ? 'ピンを変更' : 'ピンを設定'}
              </button>
              {shingoSet && (
                <button
                  onClick={() => handleRemove('shingo')}
                  disabled={saving}
                  className="px-3 py-2 text-xs text-text-sub rounded-lg border border-primary-light/30 hover:text-accent hover:border-accent/30 transition-colors"
                >
                  削除
                </button>
              )}
            </div>
          </div>

          {/* あいりの実家 */}
          <div className="rounded-xl border border-primary-light/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏠</span>
                <span className="text-sm font-medium text-text">あいりの実家</span>
              </div>
              {airiSet && (
                <span className="text-[10px] text-success bg-success/10 px-2 py-0.5 rounded-full">設定済み</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { onClose(); onStartPlacing('airi') }}
                className="flex-1 py-2 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                {airiSet ? 'ピンを変更' : 'ピンを設定'}
              </button>
              {airiSet && (
                <button
                  onClick={() => handleRemove('airi')}
                  disabled={saving}
                  className="px-3 py-2 text-xs text-text-sub rounded-lg border border-primary-light/30 hover:text-accent hover:border-accent/30 transition-colors"
                >
                  削除
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
