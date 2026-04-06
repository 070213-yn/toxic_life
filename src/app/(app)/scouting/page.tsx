// エリア下見ページ（準備中）
export default function ScoutingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="px-4 pt-8 pb-2 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text font-[family-name:var(--font-quicksand)]">
          Scouting
        </h1>
        <p className="text-sm text-text-sub mt-1">エリア下見メモ</p>
      </div>

      <div className="px-4 max-w-2xl mx-auto">
        <div className="bg-bg-card rounded-2xl p-8 shadow-sm border border-primary-light/30">
          <div className="flex flex-col items-center py-8">
            <div className="bg-primary-light/20 rounded-full p-6 mb-5">
              <svg className="w-16 h-16 text-text-sub/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <p className="text-text font-medium text-sm">このページは準備中です</p>
            <p className="text-text-sub/60 text-xs mt-1.5">もうすぐ使えるようになるよ！</p>
          </div>
        </div>
      </div>
    </div>
  )
}
