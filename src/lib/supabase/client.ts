import { createClient } from '@supabase/supabase-js'

// ブラウザ用Supabaseクライアント（シングルトン）
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
