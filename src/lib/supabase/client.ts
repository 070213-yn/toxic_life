import { createBrowserClient } from '@supabase/ssr'

// ブラウザ用Supabaseクライアント（cookieベースでセッション管理）
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
