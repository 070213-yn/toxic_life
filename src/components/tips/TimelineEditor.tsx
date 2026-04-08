'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

// タスクの型
interface Task {
  title: string
  detail: string
}

// タイムラインエントリの型
interface TimelineEntry {
  id: string
  startMonth: string  // "2026-04"
  endMonth: string    // "2026-05"（同じ月でもOK）
  tasks: Task[]
}

// ユニークID生成（簡易版）
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// デフォルトエントリ
const DEFAULT_ENTRIES: TimelineEntry[] = [
  {
    id: genId(),
    startMonth: '2026-04',
    endMonth: '2026-05',
    tasks: [
      { title: 'バイト開始', detail: 'あいりは週2〜3で' },
      { title: '貯金スタート', detail: '月5万目標' },
    ],
  },
  {
    id: genId(),
    startMonth: '2026-07',
    endMonth: '2026-07',
    tasks: [{ title: '貯金30万目標', detail: '' }],
  },
  {
    id: genId(),
    startMonth: '2026-08',
    endMonth: '2026-09',
    tasks: [{ title: '下見デート開始', detail: '' }],
  },
  {
    id: genId(),
    startMonth: '2026-10',
    endMonth: '2026-10',
    tasks: [
      { title: '貯金50万', detail: '' },
      { title: '親への相談', detail: '' },
    ],
  },
  {
    id: genId(),
    startMonth: '2026-11',
    endMonth: '2026-11',
    tasks: [{ title: '親への挨拶', detail: '' }],
  },
  {
    id: genId(),
    startMonth: '2026-12',
    endMonth: '2026-12',
    tasks: [
      { title: '貯金60万', detail: '' },
      { title: 'エリア絞り込み', detail: '' },
    ],
  },
  {
    id: genId(),
    startMonth: '2027-01',
    endMonth: '2027-03',
    tasks: [
      { title: '物件探し本格化・内見', detail: '' },
      { title: '新生活セールで家具', detail: '' },
    ],
  },
  {
    id: genId(),
    startMonth: '2027-04',
    endMonth: '2027-05',
    tasks: [{ title: '物件契約', detail: '' }],
  },
  {
    id: genId(),
    startMonth: '2027-06',
    endMonth: '2027-06',
    tasks: [{ title: '引越し準備・手続き', detail: '' }],
  },
  {
    id: genId(),
    startMonth: '2027-07',
    endMonth: '2027-07',
    tasks: [
      { title: '引越し！新生活スタート', detail: '' },
      { title: 'プライムデーで大物家電', detail: '' },
    ],
  },
  {
    id: genId(),
    startMonth: '2027-10',
    endMonth: '2027-10',
    tasks: [{ title: 'フリーレン3期開始', detail: '' }],
  },
]

// 年月を表示テキストに変換 "2026-04" -> "2026年4月"
function formatMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${y}年${parseInt(m)}月`
}

// 期間の表示テキスト
function formatPeriod(start: string, end: string): string {
  if (start === end) return formatMonth(start)
  // 同じ年の場合は短縮
  const [sy, sm] = start.split('-')
  const [ey, em] = end.split('-')
  if (sy === ey) return `${sy}年${parseInt(sm)}月〜${parseInt(em)}月`
  return `${formatMonth(start)}〜${formatMonth(end)}`
}

const SETTINGS_KEY = 'timeline_data'

export default function TimelineEditor() {
  const [entries, setEntries] = useState<TimelineEntry[]>(DEFAULT_ENTRIES)
  const [savedJson, setSavedJson] = useState<string>(JSON.stringify(DEFAULT_ENTRIES))
  const [saving, setSaving] = useState(false)
  const [showCheck, setShowCheck] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // DB から読み込み
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .single()

      if (data?.value?.entries) {
        setEntries(data.value.entries)
        setSavedJson(JSON.stringify(data.value.entries))
      }
    }
    fetch()
  }, [])

  // 変更があるか
  const hasChanges = useMemo(
    () => JSON.stringify(entries) !== savedJson,
    [entries, savedJson]
  )

  // エントリの期間を更新
  const updateEntryPeriod = useCallback((entryId: string, field: 'startMonth' | 'endMonth', value: string) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, [field]: value } : e
    ))
  }, [])

  // タスクを更新
  const updateTask = useCallback((entryId: string, taskIdx: number, field: keyof Task, value: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e
      const tasks = [...e.tasks]
      tasks[taskIdx] = { ...tasks[taskIdx], [field]: value }
      return { ...e, tasks }
    }))
  }, [])

  // タスクを追加
  const addTask = useCallback((entryId: string) => {
    setEntries(prev => prev.map(e =>
      e.id === entryId
        ? { ...e, tasks: [...e.tasks, { title: '', detail: '' }] }
        : e
    ))
  }, [])

  // タスクを削除
  const removeTask = useCallback((entryId: string, taskIdx: number) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e
      const tasks = e.tasks.filter((_, i) => i !== taskIdx)
      return { ...e, tasks }
    }))
  }, [])

  // エントリを追加
  const addEntry = useCallback(() => {
    setEntries(prev => [...prev, {
      id: genId(),
      startMonth: '2027-01',
      endMonth: '2027-01',
      tasks: [{ title: '', detail: '' }],
    }])
  }, [])

  // エントリを削除
  const removeEntry = useCallback((entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }, [])

  // 保存
  const handleSave = useCallback(async () => {
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .upsert(
        { key: SETTINGS_KEY, value: { entries } },
        { onConflict: 'key' }
      )
    setSaving(false)

    if (!error) {
      setSavedJson(JSON.stringify(entries))
      setShowCheck(true)
      setTimeout(() => setShowCheck(false), 2000)
    }
  }, [entries])

  return (
    <div className="space-y-1">
      {/* 閲覧/編集 切り替え */}
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            editMode ? 'bg-primary text-white' : 'bg-primary-light/30 text-primary hover:bg-primary-light/50'
          }`}
        >
          {editMode ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              閲覧モードへ
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              編集する
            </>
          )}
        </button>
      </div>

      {/* タイムラインリスト */}
      <div className="relative">
        <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-primary-light/60 sm:left-[60px]" />

        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="relative flex gap-3 sm:gap-4">
              {/* タイムラインドット / 期間バッジ */}
              <div className="relative z-10 shrink-0 flex flex-col items-center pt-3">
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary-light sm:hidden" />
                <div className="hidden sm:block">
                  <span className="inline-block text-[10px] font-medium text-text-sub bg-primary-light/50 px-2 py-1 rounded-lg whitespace-nowrap text-center leading-tight min-w-[100px]">
                    {formatPeriod(entry.startMonth, entry.endMonth)}
                  </span>
                </div>
              </div>

              {/* カード */}
              <div className="flex-1 min-w-0 p-3 rounded-xl bg-bg/60 border border-primary-light/20">
                {/* モバイル: 期間バッジ */}
                <div className="sm:hidden mb-2">
                  <span className="text-[10px] font-medium text-text-sub bg-primary-light/40 px-2 py-0.5 rounded-full">
                    {formatPeriod(entry.startMonth, entry.endMonth)}
                  </span>
                </div>

                {editMode ? (
                  <>
                    {/* 編集モード: 期間入力 */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <input type="month" value={entry.startMonth} onChange={e => updateEntryPeriod(entry.id, 'startMonth', e.target.value)} className="px-2 py-1 rounded-lg border border-primary-light bg-white text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <span className="text-text-sub text-xs">〜</span>
                      <input type="month" value={entry.endMonth} onChange={e => updateEntryPeriod(entry.id, 'endMonth', e.target.value)} className="px-2 py-1 rounded-lg border border-primary-light bg-white text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <button onClick={() => removeEntry(entry.id)} className="ml-auto p-1 rounded-lg text-text-sub/40 hover:text-red-400 hover:bg-red-50 transition-colors" title="この期間を削除">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    {/* 編集モード: タスクリスト */}
                    <div className="space-y-1.5">
                      {entry.tasks.map((task, ti) => (
                        <div key={ti} className="flex items-start gap-1.5 group/task">
                          <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-1">
                            <input type="text" value={task.title} onChange={e => updateTask(entry.id, ti, 'title', e.target.value)} placeholder="タスク名" className="sm:w-40 px-2 py-1 rounded-lg border border-primary-light/50 bg-white text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-text-sub/40" />
                            <input type="text" value={task.detail} onChange={e => updateTask(entry.id, ti, 'detail', e.target.value)} placeholder="詳細（任意）" className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-primary-light/30 bg-white text-xs text-text-sub focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-text-sub/40" />
                          </div>
                          <button onClick={() => removeTask(entry.id, ti)} className="p-1 rounded-lg text-text-sub/30 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover/task:opacity-100 shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => addTask(entry.id)} className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      タスクを追加
                    </button>
                  </>
                ) : (
                  /* 閲覧モード: シンプル表示 */
                  <div className="space-y-1">
                    {entry.tasks.filter(t => t.title.trim()).map((task, ti) => (
                      <div key={ti} className="flex items-baseline gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        <div>
                          <span className="text-sm font-medium text-text">{task.title}</span>
                          {task.detail && <span className="text-xs text-text-sub ml-2">{task.detail}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 編集モード時のみ: 期間追加 + 保存 */}
      {editMode && (
        <>
          <button onClick={addEntry} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-primary-light/60 text-xs text-primary hover:bg-primary-light/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            期間を追加
          </button>
        </>
      )}

      {/* 保存完了メッセージ */}
      {showCheck && (
        <div className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-medium animate-[fadeIn_0.3s_ease-out]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
