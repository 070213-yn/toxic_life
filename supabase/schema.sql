-- ==============================================
-- ふたりの旅路 - データベーススキーマ定義
-- ==============================================

-- profiles: ユーザープロフィール
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '😊',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- savings: 貯金記録
CREATE TABLE savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  memo TEXT,
  recorded_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- milestones: マイルストーン
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  deadline DATE,
  reward TEXT,
  reward_emoji TEXT,
  savings_goal INTEGER,
  sort_order INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- tasks: タスク
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID REFERENCES milestones(id) NOT NULL,
  title TEXT NOT NULL,
  assignee TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  memo TEXT,
  is_auto_savings BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- scouting_areas: エリア下見
CREATE TABLE scouting_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nearest_station TEXT,
  visited_date DATE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  access_info JSONB,
  rent_memo TEXT,
  property_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- scouting_photos: エリア写真
CREATE TABLE scouting_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES scouting_areas(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- scouting_ratings: エリア評価
CREATE TABLE scouting_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES scouting_areas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  category TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(area_id, user_id, category)
);

-- scouting_comments: エリアコメント
CREATE TABLE scouting_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES scouting_areas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(area_id, user_id)
);

-- settings: アプリ設定
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- RLS（行レベルセキュリティ）の有効化
-- ==============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- RLSポリシー定義
-- 2人だけのアプリなので、認証済みユーザーは全データ閲覧・編集可能
-- ==============================================

-- profiles: 認証済みユーザーは全プロフィール閲覧可能、自分のプロフィールのみ更新可能
CREATE POLICY "認証済みユーザーはプロフィールを閲覧可能"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "自分のプロフィールのみ更新可能"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "自分のプロフィールのみ挿入可能"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- savings: 認証済みユーザーは全貯金記録を閲覧可能、INSERT時はuser_idを自分に制限
CREATE POLICY "認証済みユーザーは貯金記録を閲覧可能"
  ON savings FOR SELECT TO authenticated USING (true);

CREATE POLICY "自分のuser_idでのみ貯金記録を挿入可能"
  ON savings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "認証済みユーザーは貯金記録を更新可能"
  ON savings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーは貯金記録を削除可能"
  ON savings FOR DELETE TO authenticated USING (true);

-- milestones: 認証済みユーザーは全操作可能
CREATE POLICY "認証済みユーザーはマイルストーンを閲覧可能"
  ON milestones FOR SELECT TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはマイルストーンを挿入可能"
  ON milestones FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "認証済みユーザーはマイルストーンを更新可能"
  ON milestones FOR UPDATE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはマイルストーンを削除可能"
  ON milestones FOR DELETE TO authenticated USING (true);

-- tasks: 認証済みユーザーは全操作可能
CREATE POLICY "認証済みユーザーはタスクを閲覧可能"
  ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはタスクを挿入可能"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "認証済みユーザーはタスクを更新可能"
  ON tasks FOR UPDATE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはタスクを削除可能"
  ON tasks FOR DELETE TO authenticated USING (true);

-- scouting_areas: 認証済みユーザーは全操作可能
CREATE POLICY "認証済みユーザーはエリアを閲覧可能"
  ON scouting_areas FOR SELECT TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはエリアを挿入可能"
  ON scouting_areas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "認証済みユーザーはエリアを更新可能"
  ON scouting_areas FOR UPDATE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーはエリアを削除可能"
  ON scouting_areas FOR DELETE TO authenticated USING (true);

-- scouting_photos: 認証済みユーザーは全操作可能
CREATE POLICY "認証済みユーザーは写真を閲覧可能"
  ON scouting_photos FOR SELECT TO authenticated USING (true);

CREATE POLICY "認証済みユーザーは写真を挿入可能"
  ON scouting_photos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "認証済みユーザーは写真を更新可能"
  ON scouting_photos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーは写真を削除可能"
  ON scouting_photos FOR DELETE TO authenticated USING (true);

-- scouting_ratings: 認証済みユーザーは閲覧可能、INSERT/UPDATEは自分のuser_idに制限
CREATE POLICY "認証済みユーザーは評価を閲覧可能"
  ON scouting_ratings FOR SELECT TO authenticated USING (true);

CREATE POLICY "自分のuser_idでのみ評価を挿入可能"
  ON scouting_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分の評価のみ更新可能"
  ON scouting_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "認証済みユーザーは評価を削除可能"
  ON scouting_ratings FOR DELETE TO authenticated USING (true);

-- scouting_comments: 認証済みユーザーは閲覧可能、INSERT/UPDATEは自分のuser_idに制限
CREATE POLICY "認証済みユーザーはコメントを閲覧可能"
  ON scouting_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "自分のuser_idでのみコメントを挿入可能"
  ON scouting_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分のコメントのみ更新可能"
  ON scouting_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "認証済みユーザーはコメントを削除可能"
  ON scouting_comments FOR DELETE TO authenticated USING (true);

-- settings: 認証済みユーザーは全操作可能
CREATE POLICY "認証済みユーザーは設定を閲覧可能"
  ON settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "認証済みユーザーは設定を挿入可能"
  ON settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "認証済みユーザーは設定を更新可能"
  ON settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "認証済みユーザーは設定を削除可能"
  ON settings FOR DELETE TO authenticated USING (true);

-- ==============================================
-- トリガー: 新規ユーザー作成時にプロフィールを自動作成
-- ==============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'ユーザー'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- トリガー: updated_at を自動更新する汎用関数
-- ==============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- savings テーブルの updated_at 自動更新
CREATE TRIGGER update_savings_updated_at
  BEFORE UPDATE ON savings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- tasks テーブルの updated_at 自動更新
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- scouting_areas テーブルの updated_at 自動更新
CREATE TRIGGER update_scouting_areas_updated_at
  BEFORE UPDATE ON scouting_areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- scouting_ratings テーブルの updated_at 自動更新
CREATE TRIGGER update_scouting_ratings_updated_at
  BEFORE UPDATE ON scouting_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- scouting_comments テーブルの updated_at 自動更新
CREATE TRIGGER update_scouting_comments_updated_at
  BEFORE UPDATE ON scouting_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- settings テーブルの updated_at 自動更新
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==============================================
-- Storage: 下見写真用バケット
-- ==============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('scouting-photos', 'scouting-photos', true);

-- 認証済みユーザーは写真をアップロード可能
CREATE POLICY "認証済みユーザーは写真をアップロード可能"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'scouting-photos');

-- 誰でも写真を閲覧可能（公開バケット）
CREATE POLICY "写真は誰でも閲覧可能"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'scouting-photos');

-- 認証済みユーザーは写真を更新可能
CREATE POLICY "認証済みユーザーは写真を更新可能"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'scouting-photos');

-- 認証済みユーザーは写真を削除可能
CREATE POLICY "認証済みユーザーは写真を削除可能"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'scouting-photos');
