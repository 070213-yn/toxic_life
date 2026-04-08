// ページ遷移中のローディング表示
// Next.jsが自動でSuspense boundaryとして使用する
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-text-sub animate-pulse">読み込み中...</p>
      </div>
    </div>
  )
}
