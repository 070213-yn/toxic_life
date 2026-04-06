# ふたりの旅路 — 同棲準備トラッカー

## 技術スタック
- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase (PostgreSQL + Auth + Storage)
- Vercel デプロイ
- recharts (グラフ), canvas-confetti (演出)

## ディレクトリ構成
- `src/app/(app)/` - 認証済みユーザー向けページ
- `src/app/login/` - ログインページ
- `src/components/` - UIコンポーネント
- `src/lib/supabase/` - Supabaseクライアント
- `src/lib/types.ts` - 型定義
- `supabase/` - SQL定義・シードデータ

## 開発ルール
- 常に日本語で応答、コメントも日本語
- モバイルファースト
- パステルカラーテーマ（CSS変数 in globals.css）
- Server Component がデフォルト、インタラクティブなものは 'use client'
- Supabase ブラウザ用: `import { supabase } from '@/lib/supabase/client'`
- Supabase サーバー用: `const supabase = await createClient()` from `@/lib/supabase/server`

## Gitルール
- コミットメッセージは日本語
- `git -C "C:/Users/oshin/toxic_life"` を使用
