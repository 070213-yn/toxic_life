'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh'
import type { GuideItem } from '@/lib/types'

// リアルタイム監視対象テーブル
const REALTIME_TABLES = ['guide_items']

// セクション定義（表示順序とアイコン・色）
const SECTION_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  '仕事・収入の安定化': { icon: '💼', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  '貯金・お金の管理': { icon: '💰', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-200' },
  '親への報告': { icon: '👨‍👩‍👧', color: 'text-rose-600', bgColor: 'bg-rose-50 border-rose-200' },
  '住まい探しの準備': { icon: '🏠', color: 'text-sky-600', bgColor: 'bg-sky-50 border-sky-200' },
  '生活スキルの練習': { icon: '🍳', color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' },
  '引越し手続き': { icon: '📦', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200' },
  '2人の新生活ルール': { icon: '📝', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  '実家から持っていくもの': { icon: '🎒', color: 'text-teal-600', bgColor: 'bg-teal-50 border-teal-200' },
}

// セクションの表示順
const SECTION_ORDER = [
  '仕事・収入の安定化',
  '貯金・お金の管理',
  '親への報告',
  '住まい探しの準備',
  '生活スキルの練習',
  '引越し手続き',
  '2人の新生活ルール',
  '実家から持っていくもの',
]

// 参考情報をセクション後に表示するための対応付け
const REFERENCE_AFTER_SECTION: Record<string, string> = {
  '貯金・お金の管理': 'living-cost',
  '住まい探しの準備': 'timeline',
  '実家から持っていくもの': 'amazon-sale',
}

// アバター表示ヘルパー
function AvatarMini({ avatar, name }: { avatar: string | null; name: string }) {
  const isImage = avatar && (avatar.startsWith('http') || avatar.startsWith('/'))
  return (
    <div
      className="w-5 h-5 rounded-full bg-primary-light/50 flex items-center justify-center overflow-hidden shrink-0"
      title={name}
    >
      {isImage ? (
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px]">{avatar || '😊'}</span>
      )}
    </div>
  )
}

// チェックボックスコンポーネント（バウンスアニメーション付き）
function CheckBox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  const [bouncing, setBouncing] = useState(false)

  const handleClick = () => {
    if (!checked) setBouncing(true)
    onChange()
  }

  return (
    <button
      onClick={handleClick}
      onAnimationEnd={() => setBouncing(false)}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
        checked
          ? 'bg-success border-success text-white'
          : 'border-text-sub/30 hover:border-primary/50'
      } ${bouncing ? 'animate-[check-bounce_0.3s_ease]' : ''}`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}

// 折りたたみコンポーネント
function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>(0)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight)
    }
  }, [isOpen, children])

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-text-sub hover:text-primary transition-colors py-1"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {title}
      </button>
      <div
        style={{ maxHeight: isOpen ? `${height}px` : '0px' }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  )
}

// メモ編集欄（吹き出し風）
function MemoEditor({ item, onSave }: { item: GuideItem; onSave: (id: string, memo: string) => void }) {
  const [memo, setMemo] = useState(item.memo || '')
  const [saving, setSaving] = useState(false)
  const hasChanged = memo !== (item.memo || '')

  const handleSave = async () => {
    setSaving(true)
    onSave(item.id, memo)
    setSaving(false)
  }

  return (
    <div className="mt-2 ml-7 relative">
      {/* 吹き出しの三角 */}
      <div className="absolute -top-1.5 left-4 w-3 h-3 bg-primary-light/20 rotate-45 border-l border-t border-primary-light/40" />
      <div className="bg-primary-light/20 border border-primary-light/40 rounded-xl p-3 relative">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="メモを追加..."
          rows={2}
          className="w-full bg-transparent text-sm text-text placeholder:text-text-sub/50 resize-none focus:outline-none"
        />
        {hasChanged && (
          <div className="flex justify-end mt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-xs rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 参考情報: 生活費シミュレーション
function LivingCostReference() {
  const data = [
    { item: '家賃', range: '7〜9万円' },
    { item: '光熱費', range: '1.5〜2.5万円' },
    { item: '通信費', range: '1〜1.5万円' },
    { item: '食費', range: '3〜5万円' },
    { item: '日用品', range: '0.5〜1万円' },
    { item: '交通費', range: '0.5〜1万円' },
    { item: 'サブスク', range: '0.3〜0.5万円' },
    { item: '予備', range: '1〜2万円' },
  ]

  return (
    <Collapsible title="生活費シミュレーション参考表">
      <div className="mt-2 bg-emerald-50/50 rounded-xl border border-emerald-200/50 p-4">
        <div className="space-y-1.5">
          {data.map((row) => (
            <div key={row.item} className="flex justify-between items-center text-sm py-1 border-b border-emerald-100 last:border-0">
              <span className="text-text">{row.item}</span>
              <span className="text-text-sub font-medium">{row.range}</span>
            </div>
          ))}
          <div className="flex justify-between items-center text-sm py-1.5 mt-1 bg-emerald-100/50 rounded-lg px-2 font-bold">
            <span className="text-text">合計</span>
            <span className="text-emerald-700">約15〜22万円</span>
          </div>
        </div>
      </div>
    </Collapsible>
  )
}

// 参考情報: Amazonセールカレンダー
function AmazonSaleReference() {
  const data = [
    { period: '7月', sale: 'プライムデー', target: '大物家電' },
    { period: '10月', sale: 'プライム感謝祭', target: 'デスク・チェア' },
    { period: '11月', sale: 'ブラックフライデー', target: 'ゲーミング関連' },
    { period: '1月', sale: '初売り', target: '福袋' },
    { period: '3月', sale: '新生活セール', target: 'ベッド・照明' },
  ]

  return (
    <Collapsible title="Amazonセールカレンダー">
      <div className="mt-2 bg-teal-50/50 rounded-xl border border-teal-200/50 p-4">
        <div className="space-y-1.5">
          {data.map((row) => (
            <div key={row.period} className="flex items-center gap-3 text-sm py-1.5 border-b border-teal-100 last:border-0">
              <span className="w-10 text-text font-medium shrink-0">{row.period}</span>
              <span className="text-text flex-1">{row.sale}</span>
              <span className="text-text-sub text-xs px-2 py-0.5 bg-teal-100/50 rounded-full">{row.target}</span>
            </div>
          ))}
        </div>
      </div>
    </Collapsible>
  )
}

// 参考情報: タイムライン全体像
function TimelineReference() {
  const data = [
    { period: '2026年4-5月', task: 'バイト開始・貯金スタート' },
    { period: '2026年7月', task: 'プライムデーで家電購入' },
    { period: '2026年8-9月', task: '下見デート開始' },
    { period: '2026年10-12月', task: '親への相談・セールで購入' },
    { period: '2027年1-3月', task: '物件探し本格化' },
    { period: '2027年4-5月', task: '物件契約' },
    { period: '2027年6月', task: '引越し準備' },
    { period: '2027年7月', task: '引越し！' },
  ]

  return (
    <Collapsible title="タイムライン全体像">
      <div className="mt-2 bg-sky-50/50 rounded-xl border border-sky-200/50 p-4">
        <div className="relative">
          {/* 縦線 */}
          <div className="absolute left-[3px] top-2 bottom-2 w-0.5 bg-sky-200" />
          <div className="space-y-3">
            {data.map((row, i) => (
              <div key={row.period} className="flex items-start gap-3 relative">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 relative z-10 ${i === data.length - 1 ? 'bg-accent ring-2 ring-accent/30' : 'bg-sky-400'}`} />
                <div>
                  <p className="text-xs text-text-sub font-medium">{row.period}</p>
                  <p className="text-sm text-text">{row.task}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Collapsible>
  )
}

// 参考情報コンポーネントのマッピング
function ReferenceSection({ type }: { type: string }) {
  switch (type) {
    case 'living-cost':
      return <LivingCostReference />
    case 'amazon-sale':
      return <AmazonSaleReference />
    case 'timeline':
      return <TimelineReference />
    default:
      return null
  }
}

// メインのクライアントコンポーネント
export default function GuidePageClient({ items }: { items: GuideItem[] }) {
  // リアルタイム監視
  useRealtimeRefresh(REALTIME_TABLES)

  const { user } = useAuth()

  // アコーディオン展開状態（セクション）
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(SECTION_ORDER))
  // メモ展開状態（アイテムID）
  const [openMemos, setOpenMemos] = useState<Set<string>>(new Set())

  // セクション別にグループ化
  const grouped = SECTION_ORDER.map((section) => ({
    section,
    items: items.filter((item) => item.section === section),
  }))

  // 全体の進捗
  const totalItems = items.length
  const checkedItems = items.filter((item) => item.is_checked).length
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0

  // セクションのアコーディオン切り替え
  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }, [])

  // メモ欄の展開切り替え
  const toggleMemo = useCallback((id: string) => {
    setOpenMemos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // チェック状態の切り替え
  const handleToggleCheck = useCallback(async (item: GuideItem) => {
    if (!user) return
    const newChecked = !item.is_checked
    await supabase
      .from('guide_items')
      .update({
        is_checked: newChecked,
        checked_by: newChecked ? user.id : null,
      })
      .eq('id', item.id)
  }, [user])

  // メモの保存
  const handleSaveMemo = useCallback(async (id: string, memo: string) => {
    await supabase
      .from('guide_items')
      .update({ memo: memo || null })
      .eq('id', id)
  }, [])

  return (
    <div className="min-h-screen bg-bg pb-24 md:pb-8">
      {/* ヘッダー */}
      <div className="px-4 pt-8 pb-6 max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text">同棲準備ガイド</h1>
          <p className="text-sm text-text-sub mt-1">ふたりで確認しながら進めよう</p>
        </div>

        {/* 全体の進捗バー */}
        <div className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text">全体の進捗</span>
            <span className="text-sm font-bold text-primary">{checkedItems}/{totalItems} 完了</span>
          </div>
          <div className="w-full h-3 bg-primary-light/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%`, animation: 'bar-fill 0.8s ease-out' }}
            />
          </div>
          <p className="text-xs text-text-sub mt-1.5 text-right">{progressPercent}%</p>
        </div>
      </div>

      {/* セクション別カード */}
      <div className="px-4 max-w-3xl mx-auto space-y-4">
        {grouped.map(({ section, items: sectionItems }) => {
          const config = SECTION_CONFIG[section] || { icon: '📋', color: 'text-text', bgColor: 'bg-bg-card border-primary-light/30' }
          const sectionChecked = sectionItems.filter((i) => i.is_checked).length
          const isOpen = openSections.has(section)
          const refType = REFERENCE_AFTER_SECTION[section]

          return (
            <div key={section}>
              <div className={`rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${config.bgColor}`}>
                {/* セクションヘッダー */}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className="text-xl">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h2 className={`font-bold text-sm ${config.color}`}>{section}</h2>
                    <p className="text-xs text-text-sub mt-0.5">
                      {sectionChecked}/{sectionItems.length} 完了
                    </p>
                  </div>
                  {/* ミニ進捗バー */}
                  <div className="w-16 h-1.5 bg-white/50 rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-300"
                      style={{ width: sectionItems.length > 0 ? `${(sectionChecked / sectionItems.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-text-sub transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* チェックリスト */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-1" style={{ animation: 'slideDown 0.2s ease-out' }}>
                    {sectionItems.map((item) => (
                      <div key={item.id}>
                        <div className="flex items-center gap-2 py-1.5">
                          <CheckBox
                            checked={item.is_checked}
                            onChange={() => handleToggleCheck(item)}
                          />
                          <button
                            onClick={() => toggleMemo(item.id)}
                            className={`flex-1 text-left text-sm transition-colors ${
                              item.is_checked ? 'text-text-sub line-through' : 'text-text'
                            } hover:text-primary`}
                          >
                            {item.title}
                          </button>
                          {/* チェックした人のアバター */}
                          {item.is_checked && item.profiles && (
                            <AvatarMini
                              avatar={item.profiles.avatar_emoji}
                              name={item.profiles.display_name}
                            />
                          )}
                          {/* メモがある場合のインジケーター */}
                          {item.memo && !openMemos.has(item.id) && (
                            <span className="text-[10px] text-text-sub/60 bg-primary-light/30 px-1.5 py-0.5 rounded-full">memo</span>
                          )}
                        </div>
                        {/* メモ欄（展開時） */}
                        {openMemos.has(item.id) && (
                          <MemoEditor item={item} onSave={handleSaveMemo} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* セクション後の参考情報 */}
              {refType && (
                <div className="mt-2 ml-2">
                  <ReferenceSection type={refType} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
