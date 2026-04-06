'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

// プリセット背景画像の定義
const PRESET_BACKGROUNDS = [
  { id: 'bg-clouds', label: 'Clouds', url: '/images/bg-clouds.png' },
  { id: 'bg-clouds2', label: 'Clouds 2', url: '/images/bg-clouds2.png' },
  { id: 'bg-kumo', label: '雲', url: '/images/bg-kumo.png' },
  { id: 'bg-pastel', label: 'Pastel', url: '/images/bg-pastel.png' },
]

// localStorageのキー
const BG_CACHE_KEY = 'toxic-life-background'

type Props = {
  onClose: () => void
}

// 設定パネル（モーダル）
// 背景画像の選択・カスタムアップロード機能
export default function SettingsPanel({ onClose }: Props) {
  const [selectedBg, setSelectedBg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 現在の設定を読み込み
  useEffect(() => {
    // まずlocalStorageから読む（高速）
    const cached = localStorage.getItem(BG_CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      setSelectedBg(parsed.url || null)
      if (parsed.isCustom) setCustomUrl(parsed.url)
    }

    // Supabaseからも取得して同期
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'background')
        .single()
      if (data?.value) {
        const val = data.value as { url?: string; isCustom?: boolean }
        setSelectedBg(val.url || null)
        if (val.isCustom) setCustomUrl(val.url || null)
        localStorage.setItem(BG_CACHE_KEY, JSON.stringify(val))
      }
    }
    fetchSettings()
  }, [])

  // 背景を選択して保存
  const selectBackground = async (url: string | null, isCustom = false) => {
    setSaving(true)
    setSelectedBg(url)

    const value = { url, isCustom }

    // localStorageに即時保存（即座に反映）
    if (url) {
      localStorage.setItem(BG_CACHE_KEY, JSON.stringify(value))
    } else {
      localStorage.removeItem(BG_CACHE_KEY)
    }

    // カスタムイベントで背景変更を通知
    window.dispatchEvent(new CustomEvent('background-change', { detail: value }))

    // Supabaseに保存（upsert: キーが存在すれば更新、なければ挿入）
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'background')
      .single()

    if (existing) {
      await supabase
        .from('settings')
        .update({ value })
        .eq('key', 'background')
    } else {
      await supabase
        .from('settings')
        .insert({ key: 'background', value })
    }

    setSaving(false)
  }

  // カスタム画像アップロード
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（5MBまで）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてね')
      return
    }

    setUploading(true)

    // Supabase Storageにアップロード
    // バケットが無い場合を考慮して、scouting-photosバケットのbgフォルダに保存
    const fileName = `bg-custom-${Date.now()}.${file.name.split('.').pop()}`
    const filePath = `backgrounds/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('scouting-photos')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('アップロードに失敗しました: ' + uploadError.message)
      setUploading(false)
      return
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('scouting-photos')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl
    setCustomUrl(publicUrl)
    setUploading(false)

    // 選択して保存
    await selectBackground(publicUrl, true)
  }

  return (
    // モーダルオーバーレイ
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-bg-card rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto border border-primary-light/30">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-light/30">
          <h2 className="text-lg font-bold text-text">設定</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-sub hover:text-text hover:bg-primary-light/20 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-5 space-y-5">
          {/* 背景画像セクション */}
          <div>
            <h3 className="text-sm font-bold text-text mb-3">背景画像</h3>

            {/* プリセット背景 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {PRESET_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => selectBackground(bg.url)}
                  disabled={saving}
                  className={`
                    relative rounded-xl overflow-hidden aspect-[16/10] border-2 transition-all duration-200
                    hover:scale-[1.02] active:scale-[0.98]
                    ${selectedBg === bg.url
                      ? 'border-primary shadow-md ring-2 ring-primary/30'
                      : 'border-primary-light/30 hover:border-primary/50'
                    }
                  `}
                >
                  <img
                    src={bg.url}
                    alt={bg.label}
                    className="w-full h-full object-cover"
                  />
                  {/* 選択中マーク */}
                  {selectedBg === bg.url && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  {/* ラベル */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1">
                    <span className="text-[10px] text-white font-medium">{bg.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* カスタム画像アップロード */}
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary-light/50 text-sm text-text-sub hover:border-primary/50 hover:text-primary hover:bg-primary-light/10 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    アップロード中...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    カスタム画像をアップロード
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* カスタム画像がある場合のプレビュー */}
              {customUrl && (
                <button
                  onClick={() => selectBackground(customUrl, true)}
                  disabled={saving}
                  className={`
                    relative w-full rounded-xl overflow-hidden aspect-[16/10] border-2 transition-all duration-200
                    ${selectedBg === customUrl
                      ? 'border-primary shadow-md ring-2 ring-primary/30'
                      : 'border-primary-light/30 hover:border-primary/50'
                    }
                  `}
                >
                  <img src={customUrl} alt="カスタム" className="w-full h-full object-cover" />
                  {selectedBg === customUrl && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1">
                    <span className="text-[10px] text-white font-medium">カスタム画像</span>
                  </div>
                </button>
              )}
            </div>

            {/* 背景なしオプション */}
            <button
              onClick={() => selectBackground(null)}
              disabled={saving}
              className={`
                mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm transition-all
                ${selectedBg === null
                  ? 'border-primary bg-primary-light/20 text-primary font-medium'
                  : 'border-primary-light/30 text-text-sub hover:border-primary/50 hover:text-primary'
                }
              `}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              背景なし
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-primary-light/30">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
