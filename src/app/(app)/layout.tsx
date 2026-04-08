import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'
import { AuthProvider } from '@/components/AuthProvider'

// 認証済みユーザー用レイアウト
// ログインしていない場合はログインページにリダイレクトする
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 未ログインならログインページへ
  if (!user) {
    redirect('/login')
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Navigation />

        {/* メインコンテンツ: PC時はサイドバー分の余白、モバイル時はフッター分の余白 */}
        <main className="flex-1 md:ml-56 pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
