import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

// 認証ミドルウェア: 全リクエストでセッション状態を確認する
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // 静的ファイルやfaviconはスキップ
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
