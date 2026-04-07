-- 料理の記録
CREATE TABLE cooking_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,              -- 料理名
  photo_path TEXT,                  -- メイン写真（Supabase Storage）
  ingredients TEXT,                 -- 使った材料
  recipe TEXT,                      -- 作り方・手順
  tips TEXT,                        -- コツ・ポイント
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),  -- 評価（1〜5）
  comment TEXT,                     -- 感想・メモ
  cooked_date DATE NOT NULL,        -- 作った日
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cooking_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "認証済みユーザーは料理記録を全操作可能" ON cooking_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER update_cooking_records_updated_at BEFORE UPDATE ON cooking_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
