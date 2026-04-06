'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

// ログインページ
// パステルカラーのやさしいデザイン
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // エラーメッセージをやさしいトーンに変換
      if (authError.message.includes('Invalid login credentials')) {
        setError('メールアドレスかパスワードが違うみたい。もう一度試してね')
      } else {
        setError('ログインできなかったよ。しばらくしてからもう一度試してね')
      }
      setLoading(false)
      return
    }

    // ログイン成功 → ホームへ
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-light/60 mb-4">
            <span className="text-3xl">&#x1F3E0;</span>
          </div>
          <h1 className="text-2xl font-bold text-primary font-[family-name:var(--font-quicksand)]">
            ふたりの旅路
          </h1>
          <p className="text-sm text-text-sub mt-1">同棲準備トラッカー</p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-bg-card rounded-2xl p-6 shadow-sm border border-primary-light/30 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-primary-light/50 bg-bg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm placeholder:text-text-sub/50"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-xl border border-primary-light/50 bg-bg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
                placeholder="パスワードを入力"
              />
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="text-sm text-accent bg-accent/10 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログインする'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
