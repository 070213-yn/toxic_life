import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ブラウザ用Supabaseクライアント（遅延初期化）
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Supabaseの環境変数が設定されていません')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

// 既存コードとの互換性のためのProxy
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
