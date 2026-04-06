'use client'

// 評価セクション
// しんご・あいりを行で分けて、各カテゴリの★をカード形式で表示

import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import type { ScoutingRating } from '@/lib/types'
import StarRating from './StarRating'

const RATING_CATEGORIES = [
  { category: 'affordability', label: '家賃の手頃さ', icon: '\u{1F3E0}' },
  { category: 'shopping', label: '買い物の便利さ', icon: '\u{1F6D2}' },
  { category: 'walkability', label: 'まちの雰囲気', icon: '\u{1F333}' },
  { category: 'environment', label: '住環境', icon: '\u{1F3D8}\u{FE0F}' },
  { category: 'safety', label: '治安', icon: '\u{1F6E1}\u{FE0F}' },
  { category: 'overall', label: 'ここに住みたい度', icon: '\u{1F495}' },
] as const

type RatingWithProfile = ScoutingRating & {
  profiles?: { id: string; display_name: string; avatar_emoji: string } | null
}

type Props = {
  areaId: string
  ratings: RatingWithProfile[]
}

export default function RatingSection({ areaId, ratings }: Props) {
  const { user, profile } = useAuth()
  const [localRatings, setLocalRatings] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    ratings.forEach((r) => {
      map[`${r.category}:${r.user_id}`] = r.rating
    })
    return map
  })
  const [savingKey, setSavingKey] = useState<string | null>(null)

  // ユーザープロフィール
  const userProfiles = useMemo(() => {
    const map = new Map<string, { displayName: string; avatarEmoji: string }>()
    ratings.forEach((r) => {
      if (r.profiles) {
        map.set(r.user_id, {
          displayName: r.profiles.display_name || '名無し',
          avatarEmoji: r.profiles.avatar_emoji || '',
        })
      }
    })
    if (user && profile) {
      map.set(user.id, {
        displayName: profile.display_name || 'わたし',
        avatarEmoji: profile.avatar_emoji || '',
      })
    }
    return map
  }, [ratings, user, profile])

  // 全ユーザーID（自分が先）
  const userIds = useMemo(() => {
    const ids = new Set(ratings.map((r) => r.user_id))
    if (user) ids.add(user.id)
    return Array.from(ids).sort((a, b) => {
      if (a === user?.id) return -1
      if (b === user?.id) return 1
      return 0
    })
  }, [ratings, user])

  // 評価変更
  const handleRate = useCallback(
    async (category: string, newValue: number) => {
      if (!user) return
      const key = `${category}:${user.id}`
      setSavingKey(key)
      setLocalRatings((prev) => ({ ...prev, [key]: newValue }))

      await supabase
        .from('scouting_ratings')
        .upsert(
          { area_id: areaId, user_id: user.id, category, rating: newValue },
          { onConflict: 'area_id,user_id,category' }
        )

      setTimeout(() => setSavingKey(null), 800)
    },
    [user, areaId]
  )

  // 各ユーザーの平均
  const getUserAvg = useCallback(
    (userId: string) => {
      let sum = 0, count = 0
      RATING_CATEGORIES.forEach(({ category }) => {
        const val = localRatings[`${category}:${userId}`]
        if (val) { sum += val; count++ }
      })
      return count > 0 ? (sum / count).toFixed(1) : '-'
    },
    [localRatings]
  )

  // 総合スコア
  const totalScore = useMemo(() => {
    let sum = 0, count = 0
    Object.values(localRatings).forEach((v) => {
      if (v > 0) { sum += v; count++ }
    })
    return count > 0 ? (sum / count).toFixed(1) : '-'
  }, [localRatings])

  const scoreLabel = useMemo(() => {
    const s = parseFloat(totalScore)
    if (isNaN(s)) return ''
    if (s >= 4.5) return '最高！'
    if (s >= 4) return 'いい感じ'
    if (s >= 3) return 'まあまあ'
    return 'うーん'
  }, [totalScore])

  // アバター表示ヘルパー
  const renderAvatar = (emoji: string, size: number) => {
    const isImage = emoji && (emoji.startsWith('http') || emoji.startsWith('/'))
    return (
      <div
        className="rounded-full bg-primary-light/30 flex items-center justify-center overflow-hidden shrink-0"
        style={{ width: size, height: size }}
      >
        {isImage ? (
          <img src={emoji} alt="" className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: size * 0.5 }}>{emoji || '👤'}</span>
        )}
      </div>
    )
  }

  return (
    <section className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 overflow-hidden">
      {/* ヘッダー */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text">
          <svg className="w-4 h-4 text-accent-warm" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          ふたりの評価
        </h2>
        <div className="flex items-center gap-2 bg-primary-light/25 rounded-full px-3.5 py-1.5">
          {scoreLabel && <span className="text-xs text-text-sub">{scoreLabel}</span>}
          <span className="text-lg font-bold text-primary">{totalScore}</span>
        </div>
      </div>

      {/* ユーザーごとの評価行 */}
      <div className="px-4 pb-5 space-y-4">
        {userIds.map((userId) => {
          const isOwn = userId === user?.id
          const prof = userProfiles.get(userId)
          const avg = getUserAvg(userId)

          return (
            <div
              key={userId}
              className={`rounded-xl p-4 ${isOwn ? 'bg-primary-light/15 border border-primary-light/30' : 'bg-accent/5 border border-accent/15'}`}
            >
              {/* ユーザー名 + 平均 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {renderAvatar(prof?.avatarEmoji || '', 28)}
                  <span className="text-sm font-medium text-text">
                    {prof?.displayName || (isOwn ? 'わたし' : '相手')}
                  </span>
                </div>
                <div className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${isOwn ? 'bg-primary-light/40 text-primary' : 'bg-accent/15 text-accent'}`}>
                  {avg}
                </div>
              </div>

              {/* カテゴリ別の★ */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {RATING_CATEGORIES.map(({ category, label, icon }) => {
                  const key = `${category}:${userId}`
                  const val = localRatings[key] || 0
                  return (
                    <div key={category} className="flex flex-col">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs">{icon}</span>
                        <span className="text-[11px] text-text-sub">{label}</span>
                        {savingKey === key && (
                          <svg className="w-3 h-3 text-success ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className={savingKey === key ? 'animate-[check-bounce_0.3s_ease-out]' : ''}>
                        <StarRating
                          value={val}
                          onChange={isOwn ? (v) => handleRate(category, v) : undefined}
                          size="md"
                          readonly={!isOwn}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export { RATING_CATEGORIES }
