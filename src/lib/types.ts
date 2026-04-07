// ユーザープロフィール
export type Profile = {
  id: string
  display_name: string
  avatar_emoji: string
  created_at: string
}

// 貯金記録
export type Saving = {
  id: string
  user_id: string
  amount: number
  memo: string | null
  recorded_date: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

// マイルストーン（大きな目標）
export type Milestone = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  deadline: string | null
  reward: string | null
  reward_emoji: string | null
  savings_goal: number | null
  sort_order: number
  is_completed: boolean
  completed_at: string | null
  created_at: string
  tasks?: Task[]
}

// タスク（マイルストーン内の個別作業）
export type Task = {
  id: string
  milestone_id: string
  title: string
  assignee: string // 'しんご' | 'あいり' | '2人共通'
  is_completed: boolean
  completed_at: string | null
  due_date: string | null
  memo: string | null
  is_auto_savings: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// 下見エリア
export type ScoutingArea = {
  id: string
  name: string
  nearest_station: string | null
  visited_date: string | null
  latitude: number | null
  longitude: number | null
  access_info: Record<string, string> | null
  rent_memo: string | null
  property_notes: string | null
  created_at: string
  updated_at: string
  scouting_photos?: ScoutingPhoto[]
  scouting_ratings?: ScoutingRating[]
  scouting_comments?: ScoutingComment[]
}

// 下見写真
export type ScoutingPhoto = {
  id: string
  area_id: string
  storage_path: string
  caption: string | null
  sort_order: number
  created_at: string
}

// 下見エリアの評価
export type ScoutingRating = {
  id: string
  area_id: string
  user_id: string
  category: string
  rating: number
  created_at: string
  updated_at: string
}

// 下見エリアのコメント
export type ScoutingComment = {
  id: string
  area_id: string
  user_id: string
  comment: string
  created_at: string
  updated_at: string
}

// タスクリアクション
export type TaskReaction = {
  id: string
  task_id: string
  user_id: string
  emoji: string
  created_at: string
  profiles?: Profile
}

// タスクコメント
export type TaskComment = {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

// 買い物カテゴリ
export type ShoppingCategory = {
  id: string
  name: string
  emoji: string | null
  sort_order: number
  created_at: string
  shopping_items?: ShoppingItem[]
}

// 買い物アイテム
export type ShoppingItem = {
  id: string
  category_id: string
  name: string
  priority: string
  status: string
  planned_timing: string | null
  memo: string | null
  sort_order: number
  created_at: string
  updated_at: string
  shopping_candidates?: ShoppingCandidate[]
}

// 候補商品
export type ShoppingCandidate = {
  id: string
  item_id: string
  product_name: string
  price: number | null
  url: string | null
  memo: string | null
  is_selected: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// 準備ガイドのチェック項目
export type GuideItem = {
  id: string
  section: string
  title: string
  is_checked: boolean
  checked_by: string | null
  memo: string | null
  sort_order: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

// 料理の記録
export type CookingRecord = {
  id: string
  user_id: string
  title: string
  photo_path: string | null
  ingredients: string | null
  recipe: string | null
  tips: string | null
  rating: number | null
  comment: string | null
  cooked_date: string
  created_at: string
  updated_at: string
  profiles?: { display_name: string; avatar_emoji: string }
}

// アプリ設定
export type Setting = {
  id: string
  key: string
  value: Record<string, unknown>
  updated_at: string
}
