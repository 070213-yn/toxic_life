-- 日記エントリーテーブル
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  photo_path TEXT,
  entry_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS（行レベルセキュリティ）を有効化
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは日記を全操作可能
CREATE POLICY "認証済みユーザーは日記を全操作可能" ON diary_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 更新時にupdated_atを自動更新するトリガー
CREATE TRIGGER update_diary_entries_updated_at BEFORE UPDATE ON diary_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
