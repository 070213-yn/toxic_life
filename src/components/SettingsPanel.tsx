'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'

const PRESET_BACKGROUNDS = [
  { id: 'bg-clouds', label: 'Clouds', url: '/images/bg-clouds.png' },
  { id: 'bg-clouds2', label: 'Clouds 2', url: '/images/bg-clouds2.png' },
  { id: 'bg-kumo', label: '雲', url: '/images/bg-kumo.png' },
  { id: 'bg-pastel', label: 'Pastel', url: '/images/bg-pastel.png' },
]

type Props = { onClose: () => void }

export default function SettingsPanel({ onClose }: Props) {
  const { user } = useAuth()
  const [selectedBg, setSelectedBg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ユーザーごとのキー
  const bgKey = user ? `background_${user.id}` : 'background'
  const cacheKey = user ? `toxic-life-bg-${user.id}` : 'toxic-life-background'

  useEffect(() => {
    // localStorageから読む
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        setSelectedBg(parsed.url || null)
        if (parsed.isCustom) setCustomUrl(parsed.url)
      }
    } catch {}

    // Supabaseから取得
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', bgKey)
        .single()
      if (data?.value) {
        const val = data.value as { url?: string; isCustom?: boolean }
        setSelectedBg(val.url || null)
        if (val.isCustom) setCustomUrl(val.url || null)
        localStorage.setItem(cacheKey, JSON.stringify(val))
      }
    }
    if (user) fetchSettings()
  }, [user, bgKey, cacheKey])

  const selectBackground = async (url: string | null, isCustom = false) => {
    setSaving(true)
    setSelectedBg(url)

    const value = { url, isCustom }
    if (url) {
      localStorage.setItem(cacheKey, JSON.stringify(value))
    } else {
      localStorage.removeItem(cacheKey)
    }

    window.dispatchEvent(new CustomEvent('background-change', { detail: value }))

    // ユーザーごとのキーで保存
    await supabase.from('settings').upsert({ key: bgKey, value }, { onConflict: 'key' })
    setSaving(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('ファイルサイズは5MB以下にしてね'); return }

    setUploading(true)
    const fileName = `bg-custom-${Date.now()}.${file.name.split('.').pop()}`
    const filePath = `backgrounds/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('scouting-photos')
      .upload(filePath, file, { upsert: true })

    if (uploadError) { alert('アップロードに失敗しました'); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('scouting-photos').getPublicUrl(filePath)
    setCustomUrl(urlData.publicUrl)
    setUploading(false)
    await selectBackground(urlData.publicUrl, true)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-bg-card rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto border border-primary-light/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-light/30">
          <h2 className="text-lg font-bold text-text">設定</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-sub hover:text-text hover:bg-primary-light/20 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-text mb-3">背景画像</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {PRESET_BACKGROUNDS.map((bg) => (
                <button key={bg.id} onClick={() => selectBackground(bg.url)} disabled={saving}
                  className={`relative rounded-xl overflow-hidden aspect-[16/10] border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${selectedBg === bg.url ? 'border-primary shadow-md ring-2 ring-primary/30' : 'border-primary-light/30 hover:border-primary/50'}`}>
                  <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                  {selectedBg === bg.url && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1">
                    <span className="text-[10px] text-white font-medium">{bg.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary-light/50 text-sm text-text-sub hover:border-primary/50 hover:text-primary hover:bg-primary-light/10 transition-all disabled:opacity-50">
                {uploading ? 'アップロード中...' : 'カスタム画像をアップロード'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

              {customUrl && (
                <button onClick={() => selectBackground(customUrl, true)} disabled={saving}
                  className={`relative w-full rounded-xl overflow-hidden aspect-[16/10] border-2 transition-all duration-200 ${selectedBg === customUrl ? 'border-primary shadow-md ring-2 ring-primary/30' : 'border-primary-light/30 hover:border-primary/50'}`}>
                  <img src={customUrl} alt="カスタム" className="w-full h-full object-cover" />
                  {selectedBg === customUrl && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1">
                    <span className="text-[10px] text-white font-medium">カスタム画像</span>
                  </div>
                </button>
              )}
            </div>

            <button onClick={() => selectBackground(null)} disabled={saving}
              className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${selectedBg === null ? 'border-primary bg-primary-light/20 text-primary font-medium' : 'border-primary-light/30 text-text-sub hover:border-primary/50 hover:text-primary'}`}>
              背景なし
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-primary-light/30">
          <button onClick={onClose} className="w-full py-2 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 active:scale-[0.98] transition-all">閉じる</button>
        </div>
      </div>
    </div>
  )
}
