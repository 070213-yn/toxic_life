'use client'

// リアルタイム更新通知トースト
// 右下に表示され、クリックでリロード
type Props = {
  show: boolean
  onReload: () => void
  onDismiss: () => void
}

export default function RealtimeToast({ show, onReload, onDismiss }: Props) {
  if (!show) return null

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-[200] animate-[fade-slide-up_0.3s_ease-out]"
    >
      <div className="bg-primary text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 max-w-xs">
        {/* アイコン */}
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">更新があります</p>
          <p className="text-[10px] text-white/70">相手が変更しました</p>
        </div>

        {/* リロードボタン */}
        <button
          onClick={onReload}
          className="shrink-0 px-3 py-1.5 bg-white text-primary text-xs font-bold rounded-lg hover:bg-white/90 transition-colors"
        >
          更新
        </button>

        {/* 閉じる */}
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 text-white/50 hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </div>
  )
}
