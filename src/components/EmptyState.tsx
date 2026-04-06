// 空状態の共通コンポーネント
// データがない場合にやさしいメッセージとアイコンを表示する

type Props = {
  icon: 'savings' | 'tasks' | 'activity' | 'scouting'
  message: string
  hint?: string
}

// 種類に応じたSVGアイコンを返す
function EmptyIcon({ icon }: { icon: Props['icon'] }) {
  const className = 'w-16 h-16 mx-auto text-text-sub/30'

  switch (icon) {
    case 'savings':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 9v1c0 1.1.9 2 2 2h1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11h.01" />
        </svg>
      )
    case 'tasks':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
        </svg>
      )
    case 'activity':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    case 'scouting':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
  }
}

export default function EmptyState({ icon, message, hint }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="bg-primary-light/20 rounded-full p-6 mb-5">
        <EmptyIcon icon={icon} />
      </div>
      <p className="text-text-sub text-sm text-center">{message}</p>
      {hint && (
        <p className="text-text-sub/60 text-xs mt-1.5 text-center">{hint}</p>
      )}
    </div>
  )
}
