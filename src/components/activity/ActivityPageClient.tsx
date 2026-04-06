'use client'

import { useState, useMemo } from 'react'
import type { Saving, Task } from '@/lib/types'

// アクティビティの種類
type ActivityType = 'saving' | 'task'

// 統合されたアクティビティエントリ
type ActivityEntry = {
  id: string
  type: ActivityType
  date: string // ISO文字列
  displayName: string
  avatar: string | null
  description: string
  memo: string | null
  amount: number | null
}

// フィルターの選択肢
type FilterType = 'all' | 'saving' | 'task'
type PersonFilter = 'all' | 'しんご' | 'あいり'

// 相対時間を計算するヘルパー
function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`

  // 7日以上前は日付を表示
  const m = date.getMonth() + 1
  const d = date.getDate()
  const h = date.getHours().toString().padStart(2, '0')
  const min = date.getMinutes().toString().padStart(2, '0')
  return `${m}/${d} ${h}:${min}`
}

// 日付のグループキー（YYYY-MM-DD）
function getDateKey(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

// 日付の表示ラベル
function formatDateLabel(dateKey: string): string {
  const today = new Date()
  const todayKey = getDateKey(today.toISOString())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = getDateKey(yesterday.toISOString())

  if (dateKey === todayKey) return '今日'
  if (dateKey === yesterdayKey) return '昨日'

  const [, m, d] = dateKey.split('-')
  return `${parseInt(m)}月${parseInt(d)}日`
}

// 金額のフォーマット
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ja-JP').format(amount)
}

// コインアイコン（貯金用）
function CoinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
      <path d="M12 6v2m0 8v2" />
    </svg>
  )
}

// チェックアイコン（タスク完了用）
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

type Props = {
  savings: Saving[]
  completedTasks: Task[]
}

export function ActivityPageClient({ savings, completedTasks }: Props) {
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [personFilter, setPersonFilter] = useState<PersonFilter>('all')

  // 貯金とタスクを統合してActivityEntryの配列にする
  const allActivities = useMemo(() => {
    const entries: ActivityEntry[] = []

    // 貯金記録を変換
    for (const s of savings) {
      const profile = s.profiles
      entries.push({
        id: `saving-${s.id}`,
        type: 'saving',
        date: s.created_at,
        displayName: profile?.display_name ?? '不明',
        avatar: profile?.avatar_emoji ?? null,
        description: `${profile?.display_name ?? '誰か'}が貯金を ¥${formatAmount(s.amount)} 追加しました`,
        memo: s.memo,
        amount: s.amount,
      })
    }

    // 完了タスクを変換
    for (const t of completedTasks) {
      entries.push({
        id: `task-${t.id}`,
        type: 'task',
        date: t.completed_at ?? t.updated_at,
        displayName: t.assignee,
        avatar: null,
        description: `${t.assignee}が「${t.title}」を完了しました`,
        memo: null,
        amount: null,
      })
    }

    // 日付の新しい順にソート
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return entries
  }, [savings, completedTasks])

  // フィルター適用
  const filteredActivities = useMemo(() => {
    return allActivities.filter((entry) => {
      // 種類フィルター
      if (filterType !== 'all' && entry.type !== filterType) return false
      // 人物フィルター
      if (personFilter !== 'all' && entry.displayName !== personFilter) return false
      return true
    })
  }, [allActivities, filterType, personFilter])

  // 日付ごとにグループ化
  const groupedActivities = useMemo(() => {
    const groups: { dateKey: string; entries: ActivityEntry[] }[] = []
    let currentKey = ''

    for (const entry of filteredActivities) {
      const key = getDateKey(entry.date)
      if (key !== currentKey) {
        currentKey = key
        groups.push({ dateKey: key, entries: [] })
      }
      groups[groups.length - 1].entries.push(entry)
    }

    return groups
  }, [filteredActivities])

  // フィルタータブの定義
  const typeFilters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'saving', label: '貯金' },
    { key: 'task', label: 'タスク' },
  ]

  const personFilters: { key: PersonFilter; label: string }[] = [
    { key: 'all', label: '全員' },
    { key: 'しんご', label: 'しんご' },
    { key: 'あいり', label: 'あいり' },
  ]

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      {/* ページヘッダー */}
      <h1 className="text-xl font-bold text-text mb-1">更新履歴</h1>
      <p className="text-sm text-text-sub mb-5">ふたりの活動をタイムラインで振り返り</p>

      {/* フィルターエリア */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* 種類フィルター */}
        <div className="flex bg-bg-card rounded-xl p-1 gap-0.5">
          {typeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                filterType === f.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-sub hover:text-primary hover:bg-primary-light/30'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 人物フィルター */}
        <div className="flex bg-bg-card rounded-xl p-1 gap-0.5">
          {personFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setPersonFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                personFilter === f.key
                  ? 'bg-accent-warm text-white shadow-sm'
                  : 'text-text-sub hover:text-accent-warm hover:bg-accent-warm/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* タイムライン */}
      {groupedActivities.length === 0 ? (
        // 空の状態
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-40">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-text-sub">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-text-sub text-sm">まだ履歴がありません</p>
          <p className="text-text-sub/60 text-xs mt-1">貯金やタスクの完了が記録されます</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedActivities.map((group) => (
            <div key={group.dateKey}>
              {/* 日付区切り */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-primary bg-primary-light/40 px-3 py-1 rounded-full">
                  {formatDateLabel(group.dateKey)}
                </span>
                <div className="flex-1 h-px bg-primary-light/30" />
              </div>

              {/* タイムラインエントリ */}
              <div className="relative pl-8">
                {/* 縦線 */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-primary-light/40 rounded-full" />

                <div className="space-y-3">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="relative">
                      {/* タイムラインのドット */}
                      <div
                        className={`absolute -left-8 top-3 w-6 h-6 rounded-full flex items-center justify-center ${
                          entry.type === 'saving'
                            ? 'bg-success/20 text-success'
                            : 'bg-primary-light/60 text-primary'
                        }`}
                      >
                        {entry.type === 'saving' ? <CoinIcon /> : <CheckIcon />}
                      </div>

                      {/* カード */}
                      <div
                        className={`rounded-2xl p-3.5 border transition-all duration-200 ${
                          entry.type === 'saving'
                            ? 'bg-success/5 border-success/15 hover:border-success/30'
                            : 'bg-primary-light/20 border-primary-light/30 hover:border-primary/30'
                        }`}
                      >
                        {/* 説明文 */}
                        <p className="text-sm text-text leading-relaxed">
                          {entry.description}
                        </p>

                        {/* メモ（貯金の場合） */}
                        {entry.memo && (
                          <p className="text-xs text-text-sub mt-1.5 pl-2 border-l-2 border-text-sub/20">
                            {entry.memo}
                          </p>
                        )}

                        {/* 日時 */}
                        <p className="text-[11px] text-text-sub/60 mt-2">
                          {formatRelativeTime(entry.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
