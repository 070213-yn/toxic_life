'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

type Props = {
  initialShingo: string
  initialAiri: string
}

// 2人のメッセージボード
// しんご・あいりそれぞれの一言メッセージを表示・編集可能
export function MessageBoard({ initialShingo, initialAiri }: Props) {
  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <p className="text-center text-text-sub text-xs tracking-widest uppercase mb-2">
        ひとことメッセージ
      </p>
      <MessageCard
        name="しんご"
        settingsKey="message_shingo"
        initialMessage={initialShingo}
        emoji="🐻"
      />
      <MessageCard
        name="あいり"
        settingsKey="message_airi"
        initialMessage={initialAiri}
        emoji="🐰"
      />
    </div>
  )
}

// 個別のメッセージカード
// 表示モードと編集モードを切り替え可能
function MessageCard({
  name,
  settingsKey,
  initialMessage,
  emoji,
}: {
  name: string
  settingsKey: string
  initialMessage: string
  emoji: string
}) {
  const [message, setMessage] = useState(initialMessage)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initialMessage)
  const [saving, setSaving] = useState(false)

  // メッセージをSupabaseに保存
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      // settingsテーブルにupsert（キーが存在すれば更新、なければ作成）
      await supabase
        .from('settings')
        .upsert(
          { key: settingsKey, value: { value: draft } },
          { onConflict: 'key' }
        )
      setMessage(draft)
      setEditing(false)
    } catch {
      // エラー時は何もしない（メッセージは戻さない）
    } finally {
      setSaving(false)
    }
  }, [draft, settingsKey])

  // 編集キャンセル
  const handleCancel = () => {
    setDraft(message)
    setEditing(false)
  }

  return (
    <div className="bg-bg-card/70 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-sm border border-primary/10 transition-all duration-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        {/* アバター絵文字 */}
        <span className="text-2xl mt-0.5">{emoji}</span>

        <div className="flex-1 min-w-0">
          {/* 名前 */}
          <p className="text-xs text-text-sub font-medium mb-1">{name}</p>

          {editing ? (
            // 編集モード
            <div className="space-y-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={100}
                placeholder="ひとことメッセージを入力..."
                className="w-full bg-bg/50 rounded-lg px-3 py-2 text-sm text-text border border-primary/20 focus:outline-none focus:border-primary/50 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancel}
                  className="text-xs text-text-sub hover:text-text transition-colors px-3 py-1 rounded-lg"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          ) : (
            // 表示モード
            <div className="flex items-center gap-2">
              <p className="text-sm text-text flex-1 truncate">
                {message || '（メッセージ未設定）'}
              </p>
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 text-text-sub hover:text-primary transition-colors p-1"
                aria-label="メッセージを編集"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
