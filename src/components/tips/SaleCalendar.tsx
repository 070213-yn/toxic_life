'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

// セール定義（固定）
interface SaleEntry {
  key: string       // "2026-05" 等
  label: string     // "2026年5月"
  name: string      // "GWセール"
  isBig: boolean    // 🔥 大型セール
  isAfterMove: boolean // 同棲後フラグ
}

const SALES: SaleEntry[] = [
  { key: '2026-05', label: '2026年5月', name: 'GWセール', isBig: false, isAfterMove: false },
  { key: '2026-07', label: '2026年7月', name: 'プライムデー', isBig: true, isAfterMove: false },
  { key: '2026-09', label: '2026年9月', name: '季節先取りセール', isBig: false, isAfterMove: false },
  { key: '2026-10', label: '2026年10月', name: 'プライム感謝祭', isBig: true, isAfterMove: false },
  { key: '2026-11', label: '2026年11月', name: 'ブラックフライデー', isBig: true, isAfterMove: false },
  { key: '2027-01', label: '2027年1月', name: '初売りセール', isBig: false, isAfterMove: false },
  { key: '2027-03', label: '2027年3月', name: '新生活セール', isBig: false, isAfterMove: false },
  { key: '2027-05', label: '2027年5月', name: 'GWセール', isBig: false, isAfterMove: false },
  { key: '2027-07', label: '2027年7月', name: 'プライムデー', isBig: true, isAfterMove: true },
  { key: '2027-09', label: '2027年9月', name: '季節先取りセール', isBig: false, isAfterMove: true },
  { key: '2027-10', label: '2027年10月', name: 'プライム感謝祭', isBig: true, isAfterMove: true },
  { key: '2027-11', label: '2027年11月', name: 'ブラックフライデー', isBig: true, isAfterMove: true },
  { key: '2028-01', label: '2028年1月', name: '初売りセール', isBig: false, isAfterMove: true },
]

// デフォルトの「狙うもの」
const DEFAULT_TARGETS: Record<string, string> = {
  '2026-05': '日用品・収納グッズ',
  '2026-07': '家電の相場チェック・小物購入',
  '2026-09': '',
  '2026-10': 'デスク・チェア候補チェック',
  '2026-11': 'ゲーミング関連の相場チェック',
  '2027-01': '福袋チェック',
  '2027-03': 'ベッド・マットレス・照明',
  '2027-05': '残りの小物・引越し直前の買い足し',
  '2027-07': '冷蔵庫・洗濯機・TV・掃除機（同棲後でOK）',
  '2027-09': '',
  '2027-10': 'プロジェクター・ルーター',
  '2027-11': 'ゲーミングチェア・モニター関連',
  '2028-01': '足りないもの',
}

const SETTINGS_KEY = 'sale_calendar'

export default function SaleCalendar() {
  const [targets, setTargets] = useState<Record<string, string>>({ ...DEFAULT_TARGETS })
  const [savedTargets, setSavedTargets] = useState<Record<string, string>>({ ...DEFAULT_TARGETS })
  const [saving, setSaving] = useState(false)
  const [showCheck, setShowCheck] = useState(false)

  // DB から読み込み
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .single()

      if (data?.value?.items) {
        // DB のデータをマージ（新しいセールが追加された場合にも対応）
        const merged = { ...DEFAULT_TARGETS, ...data.value.items }
        setTargets(merged)
        setSavedTargets(merged)
      }
    }
    fetch()
  }, [])

  // 変更があるか
  const hasChanges = useMemo(
    () => JSON.stringify(targets) !== JSON.stringify(savedTargets),
    [targets, savedTargets]
  )

  // テキスト更新
  const updateTarget = useCallback((key: string, value: string) => {
    setTargets(prev => ({ ...prev, [key]: value }))
  }, [])

  // 保存
  const handleSave = useCallback(async () => {
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: SETTINGS_KEY, value: { items: targets } },
        { onConflict: 'key' }
      )
    setSaving(false)

    if (!error) {
      setSavedTargets({ ...targets })
      setShowCheck(true)
      setTimeout(() => setShowCheck(false), 2000)
    }
  }, [targets])

  // 同棲後の最初のインデックスを取得（区切り線表示用）
  const firstAfterMoveIdx = SALES.findIndex(s => s.isAfterMove)

  return (
    <div className="space-y-1">
      {SALES.map((sale, i) => (
        <div key={sale.key}>
          {/* 同棲後の区切り線 */}
          {i === firstAfterMoveIdx && (
            <div className="flex items-center gap-2 py-2 mt-1">
              <div className="flex-1 border-t border-primary-light/60" />
              <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary-light/40">
                同棲後
              </span>
              <div className="flex-1 border-t border-primary-light/60" />
            </div>
          )}

          <div
            className={`flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 p-2.5 rounded-xl border transition-colors ${
              sale.isBig
                ? 'bg-accent-warm/10 border-accent-warm/30'
                : 'bg-bg/60 border-primary-light/20'
            }`}
          >
            {/* 年月バッジ（固定幅） */}
            <span className="shrink-0 w-[60px]">
              <span className="text-[10px] font-medium text-text-sub bg-primary-light/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                {sale.label}
              </span>
            </span>

            {/* セール名（固定幅） */}
            <span className="text-sm font-medium text-text shrink-0 w-[120px] whitespace-nowrap">
              {sale.name}
              {sale.isBig && <span className="ml-1">🔥</span>}
            </span>

            {/* 狙うものテキスト入力 */}
            <input
              type="text"
              value={targets[sale.key] || ''}
              onChange={e => updateTarget(sale.key, e.target.value)}
              placeholder="狙うものを入力..."
              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-primary-light/50 bg-white text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-text-sub/40"
            />
          </div>
        </div>
      ))}

      {/* 保存完了メッセージ */}
      {showCheck && (
        <div className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-medium animate-[fadeIn_0.3s_ease-out]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          保存しました
        </div>
      )}

      {/* 変更がある時だけ表示される固定保存バー */}
      {hasChanges && (
        <div className="sticky bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-sm border-t border-primary-light/30 px-4 py-3 flex items-center justify-between rounded-b-2xl">
          <span className="text-xs text-accent">未保存の変更があります</span>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      )}
    </div>
  )
}
