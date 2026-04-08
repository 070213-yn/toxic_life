-- 買い物カテゴリ
CREATE TABLE shopping_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 買い物アイテム
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES shopping_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'must',
  status TEXT NOT NULL DEFAULT 'not_started',
  planned_timing TEXT,
  memo TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 候補商品
CREATE TABLE shopping_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES shopping_items(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER,
  url TEXT,
  memo TEXT,
  is_selected BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE shopping_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーはカテゴリを全操作可能" ON shopping_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーはアイテムを全操作可能" ON shopping_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "認証済みユーザーは候補を全操作可能" ON shopping_candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- updated_atトリガー
CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON shopping_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_shopping_candidates_updated_at BEFORE UPDATE ON shopping_candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- シードデータ
-- ============================================================

-- カテゴリ
INSERT INTO shopping_categories (id, name, emoji, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'リビング・共有スペース', '🛋️', 1),
  ('a0000000-0000-0000-0000-000000000002', 'キッチン', '🍳', 2),
  ('a0000000-0000-0000-0000-000000000003', 'バス・トイレ・洗面', '🛁', 3),
  ('a0000000-0000-0000-0000-000000000004', '寝室', '🛏️', 4),
  ('a0000000-0000-0000-0000-000000000005', 'しんごの部屋', '🎮', 5),
  ('a0000000-0000-0000-0000-000000000006', 'あいりの部屋', '🎮', 6),
  ('a0000000-0000-0000-0000-000000000007', 'その他・生活用品', '🏠', 7);

-- リビング・共有スペース
INSERT INTO shopping_items (category_id, name, priority, sort_order, planned_timing) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'テレビ 40-50インチ', 'must', 1, 'プライムデー（7月）'),
  ('a0000000-0000-0000-0000-000000000001', 'テレビ台', 'nice', 2, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000001', 'ソファ or クッション', 'nice', 3, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000001', 'ローテーブル', 'nice', 4, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000001', 'カーテン（全部屋分）', 'must', 5, '同棲直前（6月）'),
  ('a0000000-0000-0000-0000-000000000001', '照明器具', 'must', 6, '同棲直前（6月）'),
  ('a0000000-0000-0000-0000-000000000001', 'Wi-Fiルーター', 'must', 7, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000001', 'プロジェクター', 'later', 8, '同棲開始後'),
  ('a0000000-0000-0000-0000-000000000001', 'ラグ', 'nice', 9, '同棲開始後'),
  ('a0000000-0000-0000-0000-000000000001', '収納棚', 'nice', 10, '同棲開始後'),
  ('a0000000-0000-0000-0000-000000000001', 'ゴミ箱', 'must', 11, 'セールで早めに');

-- キッチン
INSERT INTO shopping_items (category_id, name, priority, sort_order, planned_timing) VALUES
  ('a0000000-0000-0000-0000-000000000002', '冷蔵庫 200-300L', 'must', 1, 'プライムデー（7月）'),
  ('a0000000-0000-0000-0000-000000000002', '電子レンジ', 'must', 2, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000002', '炊飯器', 'must', 3, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000002', '電気ケトル', 'must', 4, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000002', 'トースター', 'nice', 5, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000002', 'フライパン・鍋セット', 'must', 6, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000002', '包丁・まな板', 'must', 7, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000002', '食器セット', 'must', 8, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000002', 'カトラリー', 'must', 9, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000002', '水切りラック', 'must', 10, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000002', 'キッチン収納ラック', 'nice', 11, 'セールで早めに');

-- バス・トイレ・洗面
INSERT INTO shopping_items (category_id, name, priority, sort_order, planned_timing) VALUES
  ('a0000000-0000-0000-0000-000000000003', '洗濯機', 'must', 1, 'プライムデー（7月）'),
  ('a0000000-0000-0000-0000-000000000003', '物干しスタンド', 'must', 2, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000003', 'タオル', 'must', 3, '同棲直前（6月）'),
  ('a0000000-0000-0000-0000-000000000003', 'バスマット', 'must', 4, '同棲直前（6月）'),
  ('a0000000-0000-0000-0000-000000000003', 'トイレ用品', 'must', 5, '同棲直前（6月）'),
  ('a0000000-0000-0000-0000-000000000003', '洗面台収納', 'nice', 6, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000003', 'ドライヤー', 'must', 7, 'セールで早めに');

-- 寝室
INSERT INTO shopping_items (category_id, name, priority, sort_order, planned_timing) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'ダブルベッドフレーム', 'must', 1, '新生活セール（3月）'),
  ('a0000000-0000-0000-0000-000000000004', 'マットレス', 'must', 2, '新生活セール（3月）'),
  ('a0000000-0000-0000-0000-000000000004', '枕 x2', 'must', 3, '新生活セール（3月）'),
  ('a0000000-0000-0000-0000-000000000004', '布団カバーセット', 'must', 4, '新生活セール（3月）'),
  ('a0000000-0000-0000-0000-000000000004', 'ベッドサイドテーブル', 'later', 5, '同棲開始後');

-- しんごの部屋
INSERT INTO shopping_items (category_id, name, priority, sort_order, planned_timing) VALUES
  ('a0000000-0000-0000-0000-000000000005', 'デスク', 'must', 1, 'ブラックフライデー（11月）'),
  ('a0000000-0000-0000-0000-000000000005', 'デスクチェア', 'must', 2, 'ブラックフライデー（11月）'),
  ('a0000000-0000-0000-0000-000000000005', 'デスクライト', 'nice', 3, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000005', 'モニターアーム', 'later', 4, '同棲開始後'),
  ('a0000000-0000-0000-0000-000000000005', 'ケーブル収納', 'nice', 5, '同棲開始後');

-- あいりの部屋
INSERT INTO shopping_items (category_id, name, priority, sort_order, planned_timing) VALUES
  ('a0000000-0000-0000-0000-000000000006', 'デスク', 'must', 1, 'ブラックフライデー（11月）'),
  ('a0000000-0000-0000-0000-000000000006', 'デスクチェア', 'must', 2, 'ブラックフライデー（11月）'),
  ('a0000000-0000-0000-0000-000000000006', 'デスクライト', 'nice', 3, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000006', 'モニターアーム', 'later', 4, '同棲開始後'),
  ('a0000000-0000-0000-0000-000000000006', 'ケーブル収納', 'nice', 5, '同棲開始後');

-- その他・生活用品
INSERT INTO shopping_items (category_id, name, priority, sort_order, planned_timing) VALUES
  ('a0000000-0000-0000-0000-000000000007', '掃除機', 'must', 1, 'プライムデー（7月）'),
  ('a0000000-0000-0000-0000-000000000007', '扇風機', 'nice', 2, '同棲開始後'),
  ('a0000000-0000-0000-0000-000000000007', '延長コード', 'must', 3, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000007', '工具セット', 'nice', 4, 'セールで早めに'),
  ('a0000000-0000-0000-0000-000000000007', '防災グッズ', 'nice', 5, '同棲開始後'),
  ('a0000000-0000-0000-0000-000000000007', '姿見ミラー', 'nice', 6, '同棲開始後');
