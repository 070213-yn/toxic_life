-- タスクリアクション
CREATE TABLE task_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  emoji TEXT NOT NULL,  -- リアクション絵文字
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id, emoji)  -- 同じ人が同じ絵文字は1回
);

-- タスクコメント
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE task_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーはリアクションを閲覧可能" ON task_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "自分のリアクションのみ挿入可能" ON task_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のリアクションのみ削除可能" ON task_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "認証済みユーザーはコメントを閲覧可能" ON task_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "自分のコメントのみ挿入可能" ON task_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自分のコメントのみ更新可能" ON task_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "自分のコメントのみ削除可能" ON task_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- updated_atトリガー
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
