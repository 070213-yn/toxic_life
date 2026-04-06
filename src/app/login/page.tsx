'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

// ユーザー定義（メールアドレスは裏で固定）
const USERS = [
  { name: 'しんご', email: 'oshin5roroa@gmail.com', emoji: '🎮' },
  { name: 'あいり', email: '', emoji: '🎀' },
]

export default function LoginPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const user = USERS.find((u) => u.name === selected)
    if (!user || !user.email) {
      setError('このアカウントはまだ準備中だよ')
      return
    }

    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (authError) {
      setError('パスワードが違うみたい。もう一度試してね')
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-xs">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary font-[family-name:var(--font-quicksand)]">
            卍Toxic Life卍
          </h1>
          <p className="text-xs text-text-sub mt-1">同棲準備トラッカー</p>
        </div>

        {/* ユーザー選択 */}
        <div className="flex gap-3 justify-center mb-5">
          {USERS.map((user) => (
            <button
              key={user.name}
              onClick={() => { setSelected(user.name); setError('') }}
              className={`flex flex-col items-center gap-1.5 px-5 py-4 rounded-2xl border-2 transition-all duration-200 ${
                selected === user.name
                  ? 'border-primary bg-primary-light/30 scale-105 shadow-md'
                  : 'border-primary-light/30 bg-bg-card hover:border-primary/40 hover:shadow-sm'
              }`}
            >
              <span className="text-3xl">{user.emoji}</span>
              <span className={`text-sm font-medium ${selected === user.name ? 'text-primary' : 'text-text'}`}>
                {user.name}
              </span>
            </button>
          ))}
        </div>

        {/* パスワード入力（ユーザー選択後に表示） */}
        {selected && (
          <form onSubmit={handleLogin} className="space-y-3" style={{ animation: 'fade-slide-up 0.3s ease-out' }}>
            <div className="bg-bg-card rounded-2xl p-5 shadow-sm border border-primary-light/30 space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-primary-light/50 bg-bg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm text-center"
                placeholder="パスワード"
              />

              {error && (
                <p className="text-xs text-accent text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
