'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Task } from '@/lib/types'

type Props = {
  milestoneId: string
  onClose: () => void
  onAdd: (task: Task) => void
}

// タスク追加モーダル
// タスク名、担当者、期限、メモを入力して新規タスクを作成
export function AddTaskModal({ milestoneId, onClose, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('2人共通')
  const [dueDate, setDueDate] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  // タスクを保存
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim()) return

      setSaving(true)
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            milestone_id: milestoneId,
            title: title.trim(),
            assignee,
            due_date: dueDate || null,
            memo: memo.trim() || null,
            is_completed: false,
            is_auto_savings: false,
            sort_order: 999, // 末尾に追加
          })
          .select()
          .single()

        if (error) throw error
        if (data) {
          onAdd(data as Task)
          onClose()
        }
      } catch {
        // エラー時はモーダルを閉じない
      } finally {
        setSaving(false)
      }
    },
    [title, assignee, dueDate, memo, milestoneId, onAdd, onClose]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-text/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative w-full max-w-md bg-bg-card rounded-t-3xl sm:rounded-3xl shadow-xl mx-0 sm:mx-4 animate-slide-up">
        {/* ハンドルバー（モバイル用） */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-text-sub/20 rounded-full" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-text text-center">
            タスクを追加
          </h3>

          {/* タスク名 */}
          <div>
            <label className="block text-xs text-text-sub mb-1">
              タスク名 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 内見の予約をする"
              maxLength={100}
              required
              autoFocus
              className="w-full bg-bg rounded-xl px-4 py-3 text-sm text-text border border-primary/15 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* 担当者 */}
          <div>
            <label className="block text-xs text-text-sub mb-1">担当者</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-bg rounded-xl px-4 py-3 text-sm text-text border border-primary/15 focus:outline-none focus:border-primary/40 transition-colors appearance-none"
            >
              <option value="しんご">しんご</option>
              <option value="あいり">あいり</option>
              <option value="2人共通">2人で</option>
              <option value="各自">各自</option>
            </select>
          </div>

          {/* 期限（任意） */}
          <div>
            <label className="block text-xs text-text-sub mb-1">
              期限（任意）
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-bg rounded-xl px-4 py-3 text-sm text-text border border-primary/15 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>

          {/* メモ（任意） */}
          <div>
            <label className="block text-xs text-text-sub mb-1">
              メモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="補足情報があれば..."
              maxLength={300}
              rows={2}
              className="w-full bg-bg rounded-xl px-4 py-3 text-sm text-text border border-primary/15 focus:outline-none focus:border-primary/40 transition-colors resize-none"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm text-text-sub bg-text-sub/5 hover:bg-text-sub/10 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 py-3 rounded-xl text-sm text-white bg-primary hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {saving ? '追加中...' : '追加する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
