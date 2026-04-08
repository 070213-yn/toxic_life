-- 既存アイテムの購入時期を一括設定
-- ※既にDBにデータがある場合にこのSQLを実行して反映する

-- 大型家電 → プライムデー（7月）
UPDATE shopping_items SET planned_timing = 'プライムデー（7月）' WHERE name IN (
  '冷蔵庫 200-300L',
  '洗濯機',
  'テレビ 40-50インチ',
  '掃除機'
);

-- 寝具 → 新生活セール（3月）
UPDATE shopping_items SET planned_timing = '新生活セール（3月）' WHERE name IN (
  'ダブルベッドフレーム',
  'マットレス',
  '枕 x2',
  '布団カバーセット'
);

-- デスク・チェア → ブラックフライデー（11月）
UPDATE shopping_items SET planned_timing = 'ブラックフライデー（11月）' WHERE name IN (
  'デスク',
  'デスクチェア'
);

-- 引越し初日に必要 → 同棲直前（6月）
UPDATE shopping_items SET planned_timing = '同棲直前（6月）' WHERE name IN (
  'カーテン（全部屋分）',
  '照明器具',
  'トイレ用品',
  'バスマット',
  'タオル'
);

-- 小物・日用品 → セールで早めに
UPDATE shopping_items SET planned_timing = 'セールで早めに' WHERE name IN (
  '食器セット',
  'カトラリー',
  'フライパン・鍋セット',
  '包丁・まな板',
  '水切りラック',
  'ゴミ箱',
  '延長コード',
  '工具セット'
);

-- 後で買ってもOK → 同棲開始後
UPDATE shopping_items SET planned_timing = '同棲開始後' WHERE name IN (
  'プロジェクター',
  'ラグ',
  '収納棚',
  'モニターアーム',
  'ケーブル収納',
  '防災グッズ',
  '姿見ミラー',
  'ベッドサイドテーブル',
  '扇風機'
);

-- その他 → セールで早めに
UPDATE shopping_items SET planned_timing = 'セールで早めに' WHERE name IN (
  'Wi-Fiルーター',
  '電子レンジ',
  '炊飯器',
  '電気ケトル',
  'トースター',
  'ドライヤー',
  'キッチン収納ラック',
  '洗面台収納',
  'ローテーブル',
  'ソファ or クッション',
  'テレビ台',
  '物干しスタンド',
  'デスクライト'
);
