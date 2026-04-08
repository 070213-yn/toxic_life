'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

// 生活費の各項目の型
interface CostItem {
  name: string
  min: number
  max: number
  note: string
}

// デフォルト値
const DEFAULT_ITEMS: CostItem[] = [
  { name: '家賃', min: 7, max: 9, note: 'エリアによる' },
  { name: '光熱費', min: 1.5, max: 2.5, note: 'ゲーミングPC2台で電気代高め' },
  { name: '通信費', min: 1, max: 1.5, note: '光回線＋格安SIM' },
  { name: '食費', min: 3, max: 5, note: '自炊メインなら3万円台' },
  { name: '日用品', min: 0.5, max: 1, note: '' },
  { name: '交通費', min: 0.5, max: 1, note: '' },
  { name: 'サブスク', min: 0.3, max: 0.5, note: '動画・ゲーム等' },
  { name: '予備・娯楽', min: 1, max: 2, note: '' },
]

// settingsテーブルのキー
const SETTINGS_KEY = 'living_cost_sim'

export default function LivingCostSim() {
  const [items, setItems] = useState<CostItem[]>(DEFAULT_ITEMS)
  const [savedItems, setSavedItems] = useState<CostItem[]>(DEFAULT_ITEMS)
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
        setItems(data.value.items)
        setSavedItems(data.value.items)
      }
    }
    fetch()
  }, [])

  // 変更があるかどうか
  const hasChanges = useMemo(
    () => JSON.stringify(items) !== JSON.stringify(savedItems),
    [items, savedItems]
  )

  // 合計計算
  const totalMin = useMemo(() => items.reduce((s, i) => s + (i.min || 0), 0), [items])
  const totalMax = useMemo(() => items.reduce((s, i) => s + (i.max || 0), 0), [items])

  // 項目更新
  const updateItem = useCallback((index: number, field: keyof CostItem, value: string | number) => {
    setItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  // 保存
  const handleSave = useCallback(async () => {
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: SETTINGS_KEY, value: { items } },
        { onConflict: 'key' }
      )
    setSaving(false)

    if (!error) {
      setSavedItems([...items])
      setShowCheck(true)
      setTimeout(() => setShowCheck(false), 2000)
    }
  }, [items])

  return (
    <div className="space-y-3">
      {/* 項目一覧 */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 p-2.5 rounded-xl bg-bg/60 border border-primary-light/20 group"
          >
            {/* 項目名（編集可能） */}
            <input
              type="text"
              value={item.name}
              onChange={e => updateItem(i, 'name', e.target.value)}
              className="text-sm font-medium text-text w-24 shrink-0 bg-transparent border-none focus:outline-none focus:bg-white focus:border focus:border-primary-light/50 rounded-lg px-1 py-0.5"
            />

            {/* 最小〜最大 入力 */}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="0"
                value={item.min}
                onChange={e => updateItem(i, 'min', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1.5 rounded-lg border border-primary-light bg-white text-sm text-text text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-text-sub text-sm">〜</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={item.max}
                onChange={e => updateItem(i, 'max', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1.5 rounded-lg border border-primary-light bg-white text-sm text-text text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs text-text-sub">万円</span>
            </div>

            {/* 備考 */}
            <input
              type="text"
              value={item.note}
              onChange={e => updateItem(i, 'note', e.target.value)}
              placeholder="備考"
              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-primary-light/50 bg-white text-xs text-text-sub focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-text-sub/40"
            />

            {/* 削除ボタン */}
            <button
              onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
              className="p-1 rounded-lg text-text-sub/30 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* 項目追加ボタン */}
      <button
        onClick={() => setItems(prev => [...prev, { name: '', min: 0, max: 0, note: '' }])}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        項目を追加
      </button>

      {/* 合計行 */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-light/30 border border-primary-light/50">
        <span className="text-sm font-bold text-text w-24 shrink-0">合計</span>
        <div className="flex items-center gap-1.5">
          <span className="text-base font-bold text-primary">{totalMin.toFixed(1)}</span>
          <span className="text-text-sub text-sm">〜</span>
          <span className="text-base font-bold text-primary">{totalMax.toFixed(1)}</span>
          <span className="text-sm text-text-sub font-medium">万円</span>
        </div>
      </div>

      {/* 保存ボタン / チェックマーク */}
      <div className="flex items-center justify-end gap-2 min-h-[36px]">
        {showCheck && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/20 text-success text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            保存しました
          </span>
        )}
        {hasChanges && !showCheck && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        )}
      </div>
    </div>
  )
}
