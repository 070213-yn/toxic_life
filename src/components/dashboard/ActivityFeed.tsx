type Activity = {
  type: string
  user_name: string
  description: string
  created_at: string
}

type Props = {
  activities: Activity[]
}

// 相対的な時間表示（例: 3時間前、昨日）
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

// 直近の活動フィード
// 貯金追加・タスク完了などを時系列で表示
export default function ActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-card p-6 shadow-sm w-full flex-1 flex flex-col">
        <h2 className="text-lg font-bold text-text mb-4">最近のできごと</h2>
        <div className="flex flex-col items-center py-6 flex-1 justify-center">
          <div className="bg-primary-light/20 rounded-full p-4 mb-3">
            <svg className="w-10 h-10 text-text-sub/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-text-sub text-sm">まだ活動記録がないよ</p>
          <p className="text-text-sub/60 text-xs mt-1">貯金やタスクの完了が記録されます</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-bg-card p-6 shadow-sm w-full flex-1 flex flex-col">
      <h2 className="text-lg font-bold text-text mb-4">最近のできごと</h2>

      <ul className="space-y-4 flex-1">
        {activities.slice(0, 5).map((activity, index) => (
          <li key={index} className="flex items-start gap-3">
            {/* アイコン */}
            <div
              className={`
                w-8 h-8 rounded-full flex-shrink-0
                flex items-center justify-center text-sm
                ${activity.type === 'saving'
                  ? 'bg-accent-warm/30 text-accent-warm'
                  : 'bg-success/30 text-success'
                }
              `}
            >
              {activity.type === 'saving' ? '💰' : '✅'}
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text leading-relaxed">
                <span className="font-semibold">{activity.user_name}</span>
                {activity.description}
              </p>
              <p className="text-xs text-text-sub mt-0.5">
                {timeAgo(activity.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
