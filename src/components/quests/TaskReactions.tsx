'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import type { TaskReaction, TaskComment } from '@/lib/types'

// リアクション候補の絵文字一覧
const REACTION_EMOJIS = ['👏', '🎉', '❤️', '🔥', '✨']

type Props = {
  taskId: string
  isCompleted: boolean
}

// タスク完了時のリアクション＆コメント表示コンポーネント
export function TaskReactions({ taskId, isCompleted }: Props) {
  const { user, profile } = useAuth()
  const [reactions, setReactions] = useState<TaskReaction[]>([])
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // リアクションとコメントを取得
  const fetchData = useCallback(async () => {
    const [reactionsRes, commentsRes] = await Promise.all([
      supabase
        .from('task_reactions')
        .select('*, profiles(display_name, avatar_emoji)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }),
      supabase
        .from('task_comments')
        .select('*, profiles(display_name, avatar_emoji)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }),
    ])

    if (reactionsRes.data) setReactions(reactionsRes.data)
    if (commentsRes.data) setComments(commentsRes.data)
  }, [taskId])

  useEffect(() => {
    if (isCompleted) fetchData()
  }, [isCompleted, fetchData])

  // 未完了タスクにはリアクション非表示
  if (!isCompleted) return null

  // リアクション絵文字のトグル（追加/削除）
  const handleReactionToggle = async (emoji: string) => {
    if (!user) return

    // 既に自分が押しているか確認
    const existing = reactions.find(
      (r) => r.user_id === user.id && r.emoji === emoji
    )

    if (existing) {
      // 削除（楽観的UI）
      setReactions((prev) => prev.filter((r) => r.id !== existing.id))
      await supabase.from('task_reactions').delete().eq('id', existing.id)
    } else {
      // 追加（楽観的UI）
      const tempReaction: TaskReaction = {
        id: crypto.randomUUID(),
        task_id: taskId,
        user_id: user.id,
        emoji,
        created_at: new Date().toISOString(),
        profiles: profile ?? undefined,
      }
      setReactions((prev) => [...prev, tempReaction])

      const { data } = await supabase
        .from('task_reactions')
        .insert({ task_id: taskId, user_id: user.id, emoji })
        .select('*, profiles(display_name, avatar_emoji)')
        .single()

      // DB結果で置き換え
      if (data) {
        setReactions((prev) =>
          prev.map((r) => (r.id === tempReaction.id ? data : r))
        )
      }
    }
  }

  // コメント送信
  const handleCommentSubmit = async () => {
    if (!user || !newComment.trim() || submitting) return
    setSubmitting(true)

    const tempComment: TaskComment = {
      id: crypto.randomUUID(),
      task_id: taskId,
      user_id: user.id,
      comment: newComment.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: profile ?? undefined,
    }
    setComments((prev) => [...prev, tempComment])
    setNewComment('')

    const { data } = await supabase
      .from('task_comments')
      .insert({ task_id: taskId, user_id: user.id, comment: tempComment.comment })
      .select('*, profiles(display_name, avatar_emoji)')
      .single()

    if (data) {
      setComments((prev) =>
        prev.map((c) => (c.id === tempComment.id ? data : c))
      )
    }
    setSubmitting(false)
  }

  // コメント削除
  const handleCommentDelete = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    await supabase.from('task_comments').delete().eq('id', commentId)
  }

  // 絵文字ごとにグループ化（カウント＆誰が押したか）
  const reactionGroups = REACTION_EMOJIS.map((emoji) => {
    const items = reactions.filter((r) => r.emoji === emoji)
    const myReaction = items.find((r) => r.user_id === user?.id)
    return { emoji, count: items.length, myReaction, items }
  })

  // 経過時間の表示（例: 3分前、2時間前）
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}時間前`
    const days = Math.floor(hours / 24)
    return `${days}日前`
  }

  return (
    <div className="ml-8 mt-1 mb-2 space-y-2">
      {/* リアクションボタン一覧 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {reactionGroups.map(({ emoji, count, myReaction }) => (
          <button
            key={emoji}
            onClick={() => handleReactionToggle(emoji)}
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm
              transition-all duration-200 hover:scale-110 active:scale-95
              ${
                myReaction
                  ? 'bg-primary-light border border-primary/40 shadow-sm'
                  : 'bg-bg-card border border-text-sub/15 hover:border-primary/30'
              }
            `}
            title={`${emoji} リアクション`}
          >
            <span className="text-base leading-none">{emoji}</span>
            {count > 0 && (
              <span className="text-xs text-text-sub font-medium">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* コメント一覧 */}
      {comments.length > 0 && (
        <div className="space-y-1.5">
          {comments.map((comment) => (
            <div key={comment.id} className="group/comment flex gap-2 items-start">
              {/* 吹き出し風コメント */}
              <div className="relative bg-bg-card border border-text-sub/10 rounded-2xl rounded-tl-sm px-3 py-1.5 max-w-[85%] shadow-sm">
                <p className="text-xs font-medium text-primary mb-0.5">
                  {comment.profiles?.avatar_emoji ?? '👤'}{' '}
                  {comment.profiles?.display_name ?? '不明'}
                  <span className="text-text-sub font-normal ml-2">
                    {timeAgo(comment.created_at)}
                  </span>
                </p>
                <p className="text-sm text-text leading-relaxed">{comment.comment}</p>
              </div>
              {/* 自分のコメントのみ削除可能 */}
              {comment.user_id === user?.id && (
                <button
                  onClick={() => handleCommentDelete(comment.id)}
                  className="shrink-0 opacity-0 group-hover/comment:opacity-100 text-text-sub hover:text-accent transition-all p-1 mt-1"
                  aria-label="コメントを削除"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* コメント入力欄 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              handleCommentSubmit()
            }
          }}
          placeholder="ひとことコメント..."
          className="flex-1 text-sm bg-bg-card border border-text-sub/15 rounded-full px-3 py-1.5
            placeholder:text-text-sub/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20
            transition-all duration-200"
        />
        <button
          onClick={handleCommentSubmit}
          disabled={!newComment.trim() || submitting}
          className="shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center
            hover:bg-primary/80 active:scale-90 transition-all duration-200
            disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="コメントを送信"
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
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
