'use client'

// コメントセクション
// しんご・あいり2人分のフリーコメントを吹き出し風デザインで表示
// 自分のコメントのみ編集・保存可能。保存時にチェックマーク表示

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import type { ScoutingComment } from '@/lib/types'

type CommentWithProfile = ScoutingComment & {
  profiles?: { display_name: string; avatar_emoji: string } | null
}

type Props = {
  areaId: string
  comments: CommentWithProfile[]
}

// 吹き出しコンポーネント（1人分）
function CommentBubble({
  comment,
  isOwn,
  displayName,
  avatarEmoji,
  onSave,
  saving,
}: {
  comment: string
  isOwn: boolean
  displayName: string
  avatarEmoji: string
  onSave: (text: string) => void
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment)
  const [justSaved, setJustSaved] = useState(false)

  const handleSave = useCallback(() => {
    onSave(draft.trim())
    setEditing(false)
    // 保存成功チェックマーク表示
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }, [draft, onSave])

  const handleCancel = useCallback(() => {
    setDraft(comment)
    setEditing(false)
  }, [comment])

  return (
    <div className={`flex gap-3 ${isOwn ? '' : 'flex-row-reverse'}`}>
      {/* アバター */}
      <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm overflow-hidden ${
        isOwn ? 'bg-primary-light/50' : 'bg-accent/20'
      }`}>
        {avatarEmoji && (avatarEmoji.startsWith('http') || avatarEmoji.startsWith('/')) ? (
          <img src={avatarEmoji} alt="" className="w-full h-full object-cover" />
        ) : (
          avatarEmoji || '\u{1F464}'
        )}
      </div>

      {/* 吹き出し本体 */}
      <div className={`flex-1 min-w-0 ${isOwn ? '' : 'text-right'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium text-text-sub ${isOwn ? '' : 'ml-auto'}`}>
            {displayName}
          </span>
          {justSaved && (
            <span className="text-xs text-success animate-[fade-slide-up_0.3s_ease-out]">
              <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
        <div
          className={`relative rounded-2xl px-4 py-3 transition-all ${
            isOwn
              ? 'bg-primary-light/25 rounded-tl-sm'
              : 'bg-accent/10 rounded-tr-sm'
          } ${isOwn && !editing ? 'hover:bg-primary-light/35 cursor-pointer' : ''}`}
          onClick={() => {
            if (isOwn && !editing) {
              setEditing(true)
              setDraft(comment)
            }
          }}
        >
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="感想をメモ...「ここの商店街のコロッケが最高だった」とか"
                className="w-full text-sm text-text bg-transparent border-none outline-none resize-none placeholder:text-text-sub/40 text-left"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-sub/40">
                  {draft.length}/500
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancel() }}
                    className="text-xs text-text-sub hover:text-text transition-colors px-3 py-1 rounded-lg"
                  >
                    やめる
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSave() }}
                    disabled={saving || !draft.trim()}
                    className="text-xs text-white bg-primary hover:bg-primary/80 disabled:opacity-40 transition-colors px-3 py-1.5 rounded-lg"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {comment ? (
                <p className={`text-sm text-text whitespace-pre-wrap leading-relaxed ${isOwn ? '' : 'text-left'}`}>
                  {comment}
                </p>
              ) : (
                <p className={`text-sm text-text-sub/40 italic ${isOwn ? '' : 'text-left'}`}>
                  {isOwn ? 'タップして感想を書こう...' : 'まだ書いてないみたい'}
                </p>
              )}
            </>
          )}
        </div>

        {/* 自分のコメントなら編集ヒント */}
        {isOwn && !editing && (
          <p className="text-xs text-text-sub/40 mt-1">
            タップで{comment ? '編集' : '入力'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function CommentSection({ areaId, comments }: Props) {
  const { user, profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [localComments, setLocalComments] = useState<Record<string, string>>(
    () => {
      const map: Record<string, string> = {}
      comments.forEach((c) => {
        map[c.user_id] = c.comment
      })
      return map
    }
  )

  // コメント保存（upsert: UNIQUE(area_id, user_id)制約）
  const handleSave = useCallback(
    async (text: string) => {
      if (!user) return
      setSaving(true)

      // 楽観的更新
      setLocalComments((prev) => ({ ...prev, [user.id]: text }))

      const { error } = await supabase
        .from('scouting_comments')
        .upsert(
          {
            area_id: areaId,
            user_id: user.id,
            comment: text,
          },
          { onConflict: 'area_id,user_id' }
        )

      if (error) {
        console.error('コメント保存に失敗:', error)
        const original = comments.find((c) => c.user_id === user.id)
        setLocalComments((prev) => ({
          ...prev,
          [user.id]: original?.comment || '',
        }))
      }

      setSaving(false)
    },
    [user, areaId, comments]
  )

  // ユーザー情報のマッピング（プロフィール情報を取得）
  const userProfiles = new Map<
    string,
    { displayName: string; avatarEmoji: string }
  >()

  comments.forEach((c) => {
    userProfiles.set(c.user_id, {
      displayName: c.profiles?.display_name || '名無し',
      avatarEmoji: c.profiles?.avatar_emoji || '\u{1F464}',
    })
  })

  // 自分の情報は必ず追加
  if (user && profile) {
    userProfiles.set(user.id, {
      displayName: profile.display_name || 'わたし',
      avatarEmoji: profile.avatar_emoji || '\u{1F464}',
    })
  }

  // 表示対象のユーザーID（自分が先）
  const userIds = Array.from(userProfiles.keys()).sort((a, b) => {
    if (a === user?.id) return -1
    if (b === user?.id) return 1
    return 0
  })

  return (
    <section className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 overflow-hidden">
      {/* セクションヘッダー */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          ふたりの感想
        </h2>
        <p className="text-xs text-text-sub/60 mt-0.5 pl-6">
          このエリアの印象をメモしよう
        </p>
      </div>

      {/* コメント一覧 */}
      <div className="px-5 pb-5 space-y-5">
        {userIds.map((userId) => {
          const info = userProfiles.get(userId)!
          return (
            <CommentBubble
              key={userId}
              comment={localComments[userId] || ''}
              isOwn={userId === user?.id}
              displayName={info.displayName}
              avatarEmoji={info.avatarEmoji}
              onSave={handleSave}
              saving={saving}
            />
          )
        })}
      </div>
    </section>
  )
}
