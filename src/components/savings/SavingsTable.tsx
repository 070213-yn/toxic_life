'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import type { Saving } from '@/lib/types'

// 貯金記録の一覧テーブル
// フィルター（月別・人別）、インライン編集、削除確認機能付き
export function SavingsTable({ savings }: { savings: Saving[] }) {
  const router = useRouter()
  const { user } = useAuth()

  // フィルター状態
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterPerson, setFilterPerson] = useState<'all' | 'しんご' | 'あいり'>('all')

  // 編集・削除の状態管理
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editMemo, setEditMemo] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // 月のリストを生成（フィルター用プルダウン）
  const months = useMemo(() => {
    const monthSet = new Set(savings.map((s) => s.recorded_date.slice(0, 7)))
    return Array.from(monthSet).sort().reverse()
  }, [savings])

  // フィルター適用後のデータ
  const filtered = useMemo(() => {
    return savings.filter((s) => {
      if (filterMonth !== 'all' && !s.recorded_date.startsWith(filterMonth)) return false
      if (filterPerson !== 'all' && s.profiles?.display_name !== filterPerson) return false
      return true
    })
  }, [savings, filterMonth, filterPerson])

  // 編集開始
  const startEdit = (saving: Saving) => {
    setEditingId(saving.id)
    setEditAmount(saving.amount.toLocaleString())
    setEditMemo(saving.memo ?? '')
  }

  // 編集を保存
  const saveEdit = async (id: string) => {
    setProcessing(true)
    const numAmount = parseInt(editAmount.replace(/[^0-9]/g, ''), 10)

    await supabase.from('savings').update({
      amount: numAmount,
      memo: editMemo.trim() || null,
    }).eq('id', id)

    setEditingId(null)
    setProcessing(false)
    router.refresh()
  }

  // 削除を実行
  const confirmDelete = async (id: string) => {
    setProcessing(true)
    await supabase.from('savings').delete().eq('id', id)
    setDeletingId(null)
    setProcessing(false)
    router.refresh()
  }

  // 月表示を日本語に変換（"2026-04" → "2026年4月"）
  const formatMonth = (m: string) => {
    const [y, mon] = m.split('-')
    return `${y}年${parseInt(mon, 10)}月`
  }

  // 日付表示（"2026-04-06" → "4/6"）
  const formatDate = (d: string) => {
    const [, m, day] = d.split('-')
    return `${parseInt(m, 10)}/${parseInt(day, 10)}`
  }

  // 金額入力時のカンマ区切り処理
  const handleAmountChange = (value: string) => {
    const num = value.replace(/[^0-9]/g, '')
    setEditAmount(num ? parseInt(num, 10).toLocaleString() : '')
  }

  return (
    <div className="bg-bg-card rounded-2xl p-4 md:p-6 shadow-sm border border-primary-light/30">
      <h2 className="text-lg font-bold text-text mb-4">貯金記録</h2>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* 月別フィルター */}
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-1.5 text-xs bg-bg rounded-lg border border-primary-light/40
                     text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">すべての月</option>
          {months.map((m) => (
            <option key={m} value={m}>{formatMonth(m)}</option>
          ))}
        </select>

        {/* 人別フィルター */}
        <div className="flex gap-1">
          {(['all', 'しんご', 'あいり'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPerson(p)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                filterPerson === p
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-bg text-text-sub border border-primary-light/30 hover:bg-primary-light/20'
              }`}
            >
              {p === 'all' ? '全員' : p}
            </button>
          ))}
        </div>
      </div>

      {/* レコード数表示 */}
      <p className="text-xs text-text-sub mb-3">
        {filtered.length}件の記録
      </p>

      {/* デスクトップ: テーブル表示 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-primary-light/30">
              <th className="text-left py-2 px-2 text-xs text-text-sub font-medium">日付</th>
              <th className="text-left py-2 px-2 text-xs text-text-sub font-medium">名前</th>
              <th className="text-right py-2 px-2 text-xs text-text-sub font-medium">金額</th>
              <th className="text-left py-2 px-2 text-xs text-text-sub font-medium">メモ</th>
              <th className="text-right py-2 px-2 text-xs text-text-sub font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-primary-light/15 hover:bg-primary-light/10 transition-colors">
                <td className="py-2.5 px-2 text-text-sub">{formatDate(s.recorded_date)}</td>
                <td className="py-2.5 px-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    s.profiles?.display_name === 'しんご'
                      ? 'bg-primary-light/40 text-primary'
                      : 'bg-accent/20 text-accent'
                  }`}>
                    {s.profiles?.avatar_emoji} {s.profiles?.display_name}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  {editingId === s.id ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-28 px-2 py-1 text-right bg-bg rounded-lg border border-primary/40
                                 text-sm font-bold font-[family-name:var(--font-dm-sans)]
                                 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  ) : (
                    <span className="font-bold font-[family-name:var(--font-dm-sans)] text-text">
                      {s.amount.toLocaleString()}
                      <span className="text-xs font-normal text-text-sub ml-0.5">円</span>
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-2 text-text-sub text-xs max-w-[160px] truncate">
                  {editingId === s.id ? (
                    <input
                      type="text"
                      value={editMemo}
                      onChange={(e) => setEditMemo(e.target.value)}
                      className="w-full px-2 py-1 bg-bg rounded-lg border border-primary/40
                                 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  ) : (
                    s.memo || '-'
                  )}
                </td>
                <td className="py-2.5 px-2 text-right">
                  {/* 自分の記録のみ編集・削除可能 */}
                  {user?.id === s.user_id && (
                    <div className="flex gap-1.5 justify-end">
                      {editingId === s.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(s.id)}
                            disabled={processing}
                            className="px-2.5 py-1 text-xs bg-success/20 text-success rounded-lg
                                       hover:bg-success/30 transition-colors disabled:opacity-50"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-xs bg-bg text-text-sub rounded-lg
                                       hover:bg-primary-light/20 transition-colors"
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(s)}
                            className="px-2.5 py-1 text-xs bg-primary-light/30 text-primary rounded-lg
                                       hover:bg-primary-light/50 transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => setDeletingId(s.id)}
                            className="px-2.5 py-1 text-xs bg-accent/10 text-accent rounded-lg
                                       hover:bg-accent/20 transition-colors"
                          >
                            削除
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モバイル: カード型表示 */}
      <div className="md:hidden space-y-2.5">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="bg-bg rounded-xl p-3.5 border border-primary-light/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  s.profiles?.display_name === 'しんご'
                    ? 'bg-primary-light/40 text-primary'
                    : 'bg-accent/20 text-accent'
                }`}>
                  {s.profiles?.avatar_emoji} {s.profiles?.display_name}
                </span>
                <span className="text-xs text-text-sub">{formatDate(s.recorded_date)}</span>
              </div>
              {editingId === s.id ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={editAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-24 px-2 py-1 text-right bg-bg-card rounded-lg border border-primary/40
                             text-lg font-bold font-[family-name:var(--font-dm-sans)]
                             focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              ) : (
                <span className="text-lg font-bold font-[family-name:var(--font-dm-sans)] text-text">
                  {s.amount.toLocaleString()}
                  <span className="text-xs font-normal text-text-sub ml-0.5">円</span>
                </span>
              )}
            </div>

            {/* メモ行 */}
            {editingId === s.id ? (
              <input
                type="text"
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                placeholder="メモ"
                className="w-full px-2 py-1 mb-2 bg-bg-card rounded-lg border border-primary/40
                           text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            ) : (
              s.memo && (
                <p className="text-xs text-text-sub mb-2">{s.memo}</p>
              )
            )}

            {/* 操作ボタン（自分の記録のみ） */}
            {user?.id === s.user_id && (
              <div className="flex gap-2 justify-end">
                {editingId === s.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(s.id)}
                      disabled={processing}
                      className="px-3 py-1 text-xs bg-success/20 text-success rounded-lg
                                 hover:bg-success/30 transition-colors disabled:opacity-50"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-xs bg-bg-card text-text-sub rounded-lg
                                 hover:bg-primary-light/20 transition-colors"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(s)}
                      className="px-3 py-1 text-xs bg-primary-light/30 text-primary rounded-lg
                                 hover:bg-primary-light/50 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => setDeletingId(s.id)}
                      className="px-3 py-1 text-xs bg-accent/10 text-accent rounded-lg
                                 hover:bg-accent/20 transition-colors"
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 記録がない場合 */}
      {filtered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-text-sub text-sm">記録がまだありません</p>
          <p className="text-text-sub/60 text-xs mt-1">上の「+ 記録する」ボタンから追加してみましょう</p>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl animate-[slideDown_0.2s_ease-out]">
            <h3 className="text-base font-bold text-text mb-2">この記録を削除しますか？</h3>
            <p className="text-sm text-text-sub mb-5">
              一度削除すると元に戻せません。<br />
              間違いでなければ「削除する」を押してください。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 text-sm text-text-sub bg-bg rounded-xl
                           border border-primary-light/30
                           hover:bg-primary-light/20 transition-colors"
              >
                やっぱりやめる
              </button>
              <button
                onClick={() => confirmDelete(deletingId)}
                disabled={processing}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-accent rounded-xl
                           shadow-md shadow-accent/25
                           hover:shadow-lg hover:shadow-accent/30
                           disabled:opacity-50 transition-all"
              >
                {processing ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
