'use client'

// 評価セクション全体
// 7つの評価項目について、しんご・あいり2人分の星評価を横並び比較表示
// 自分の評価のみ変更可能。Supabaseにupsertでリアルタイム保存
// 星タップ時にscaleバウンスアニメーション付き

import { useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import type { ScoutingRating } from '@/lib/types'
import StarRating from './StarRating'

// 評価カテゴリ定義
const RATING_CATEGORIES = [
  { category: 'affordability', label: '家賃の手頃さ', icon: '\u{1F3E0}' },
  { category: 'access', label: 'アクセスの良さ', icon: '\u{1F683}' },
  { category: 'shopping', label: '買い物の便利さ', icon: '\u{1F6D2}' },
  { category: 'walkability', label: 'お散歩の楽しさ', icon: '\u{1F333}' },
  { category: 'environment', label: '住環境', icon: '\u{1F3D8}\u{FE0F}' },
  { category: 'room_options', label: '部屋の広さ', icon: '\u{1F3AE}' },
  { category: 'overall', label: 'ここに住みたい度', icon: '\u{1F495}' },
] as const

// プロフィール付き評価型
type RatingWithProfile = ScoutingRating & {
  profiles?: { id: string; display_name: string; avatar_emoji: string } | null
}

type Props = {
  areaId: string
  ratings: RatingWithProfile[]
}

// 1つの評価カテゴリ行（2人分の星評価を横並び表示）
function CategoryRow({
  category,
  label,
  icon,
  areaId,
  ratings,
  currentUserId,
  userProfiles,
  onRatingChange,
}: {
  category: string
  label: string
  icon: string
  areaId: string
  ratings: RatingWithProfile[]
  currentUserId: string | undefined
  userProfiles: Map<string, { displayName: string; avatarEmoji: string }>
  onRatingChange: (category: string, userId: string, rating: number) => void
}) {
  const [saving, setSaving] = useState(false)
  const [bouncing, setBouncing] = useState(false)

  // 2人分のローカル評価値
  const [localRatings, setLocalRatings] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    ratings.forEach((r) => {
      map[r.user_id] = r.rating
    })
    return map
  })

  // 全ユーザーID（自分が先）
  const userIds = useMemo(() => {
    const ids = new Set(ratings.map((r) => r.user_id))
    if (currentUserId) ids.add(currentUserId)
    return Array.from(ids).sort((a, b) => {
      if (a === currentUserId) return -1
      if (b === currentUserId) return 1
      return 0
    })
  }, [ratings, currentUserId])

  // 評価変更ハンドラ（Supabaseにupsert）
  const handleRate = useCallback(
    async (newValue: number) => {
      if (!currentUserId) return
      setSaving(true)
      setBouncing(true)
      setTimeout(() => setBouncing(false), 300)

      // 楽観的更新
      setLocalRatings((prev) => ({ ...prev, [currentUserId]: newValue }))
      onRatingChange(category, currentUserId, newValue)

      const { error } = await supabase
        .from('scouting_ratings')
        .upsert(
          {
            area_id: areaId,
            user_id: currentUserId,
            category,
            rating: newValue,
          },
          { onConflict: 'area_id,user_id,category' }
        )

      if (error) {
        console.error('評価の保存に失敗:', error)
        const original = ratings.find((r) => r.user_id === currentUserId)
        setLocalRatings((prev) => ({
          ...prev,
          [currentUserId]: original?.rating || 0,
        }))
      }

      setSaving(false)
    },
    [currentUserId, areaId, category, ratings, onRatingChange]
  )

  return (
    <div className="py-3 border-b border-primary-light/15 last:border-b-0">
      {/* カテゴリ名 */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-medium text-text">{label}</span>
        {saving && (
          <span className="text-xs text-success ml-auto animate-[fade-slide-up_0.3s_ease-out]">
            <svg className="w-3.5 h-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>

      {/* 2人分の評価を横並び比較 */}
      <div className="grid grid-cols-2 gap-3 pl-1">
        {userIds.map((userId) => {
          const isOwn = userId === currentUserId
          const value = localRatings[userId] || 0
          const profile = userProfiles.get(userId)
          return (
            <div
              key={userId}
              className={`rounded-xl px-3 py-2 ${
                isOwn
                  ? 'bg-primary-light/20'
                  : 'bg-accent/8'
              }`}
            >
              <span className="text-xs text-text-sub block mb-1">
                {profile?.displayName || (isOwn ? 'わたし' : '相手')}
              </span>
              <div className={`${bouncing && isOwn ? 'animate-[check-bounce_0.3s_ease-out]' : ''}`}>
                <StarRating
                  value={value}
                  onChange={isOwn ? handleRate : undefined}
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
}

export default function RatingSection({ areaId, ratings }: Props) {
  const { user, profile } = useAuth()
  // 楽観的更新を追跡（総合スコア再計算用）
  const [ratingOverrides, setRatingOverrides] = useState<Record<string, number>>({})

  const handleRatingChange = useCallback(
    (category: string, userId: string, rating: number) => {
      setRatingOverrides((prev) => ({
        ...prev,
        [`${category}:${userId}`]: rating,
      }))
    },
    []
  )

  // ユーザープロフィール情報マッピング
  const userProfiles = useMemo(() => {
    const map = new Map<string, { displayName: string; avatarEmoji: string }>()

    ratings.forEach((r) => {
      if (r.profiles) {
        map.set(r.user_id, {
          displayName: r.profiles.display_name || '名無し',
          avatarEmoji: r.profiles.avatar_emoji || '\u{1F464}',
        })
      }
    })

    // 自分の情報は必ず追加
    if (user && profile) {
      map.set(user.id, {
        displayName: profile.display_name || 'わたし',
        avatarEmoji: profile.avatar_emoji || '\u{1F464}',
      })
    }

    return map
  }, [ratings, user, profile])

  // 総合スコア計算（全項目 x 全ユーザーの平均）
  const totalScore = useMemo(() => {
    let sum = 0
    let count = 0

    RATING_CATEGORIES.forEach(({ category }) => {
      const categoryRatings = ratings.filter((r) => r.category === category)
      categoryRatings.forEach((r) => {
        const key = `${category}:${r.user_id}`
        const value = ratingOverrides[key] ?? r.rating
        sum += value
        count++
      })
    })

    // 新規評価（元データにない分）
    Object.entries(ratingOverrides).forEach(([key, value]) => {
      const [cat, uid] = key.split(':')
      const existing = ratings.find(
        (r) => r.category === cat && r.user_id === uid
      )
      if (!existing) {
        sum += value
        count++
      }
    })

    return count > 0 ? (sum / count).toFixed(1) : '-'
  }, [ratings, ratingOverrides])

  // スコアに応じた色とラベル
  const scoreInfo = useMemo(() => {
    const score = parseFloat(totalScore)
    if (isNaN(score)) return { color: 'text-text-sub', label: '' }
    if (score >= 4.5) return { color: 'text-success', label: '最高！' }
    if (score >= 4) return { color: 'text-success', label: 'いい感じ' }
    if (score >= 3) return { color: 'text-accent-warm', label: 'まあまあ' }
    if (score >= 2) return { color: 'text-primary', label: 'うーん' }
    return { color: 'text-accent', label: 'ちょっと...' }
  }, [totalScore])

  return (
    <section className="bg-bg-card rounded-2xl shadow-sm border border-primary-light/30 overflow-hidden">
      {/* セクションヘッダー */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text">
          <svg className="w-4 h-4 text-accent-warm" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          ふたりの評価
        </h2>
        {/* 総合スコアバッジ */}
        <div className="flex items-center gap-2 bg-primary-light/25 rounded-full px-3.5 py-1.5">
          {scoreInfo.label && (
            <span className="text-xs text-text-sub">{scoreInfo.label}</span>
          )}
          <span className={`text-lg font-bold ${scoreInfo.color}`}>{totalScore}</span>
        </div>
      </div>

      {/* 評価項目リスト */}
      <div className="px-5 pb-5">
        {RATING_CATEGORIES.map(({ category, label, icon }) => (
          <CategoryRow
            key={category}
            category={category}
            label={label}
            icon={icon}
            areaId={areaId}
            ratings={ratings.filter((r) => r.category === category)}
            currentUserId={user?.id}
            userProfiles={userProfiles}
            onRatingChange={handleRatingChange}
          />
        ))}
      </div>
    </section>
  )
}

// 外部から評価カテゴリ定義にアクセスできるようexport
export { RATING_CATEGORIES }
