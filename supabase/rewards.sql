-- ご褒美詳細テーブル
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_path TEXT,           -- 画像（Supabase Storage）
  url TEXT,                  -- 外部リンク
  message TEXT,              -- お祝いメッセージ
  planned_date DATE,         -- 予定日
  is_secret BOOLEAN DEFAULT FALSE,  -- 秘密のご褒美フラグ
  is_revealed BOOLEAN DEFAULT FALSE, -- 秘密が公開されたか
  revealed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "認証済みユーザーはご褒美を全操作可能" ON rewards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
