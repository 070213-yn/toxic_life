'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import type { CookingRecord } from '@/lib/types'

// リアルタイム監視対象テーブル（コンポーネント外で定数定義）

// Supabase Storageの公開URL生成
function getPhotoUrl(path: string) {
  const { data } = supabase.storage.from('scouting-photos').getPublicUrl(path)
  return data.publicUrl
}

// アバター表示ヘルパー
function AvatarDisplay({ avatar, size = 28 }: { avatar: string | null; size?: number }) {
  const isImage = avatar && (avatar.startsWith('http') || avatar.startsWith('/'))
  return (
    <div
      className="rounded-full bg-primary-light/50 flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {isImage ? (
        <img src={avatar} alt="" className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.55 }}>{avatar || '😊'}</span>
      )}
    </div>
  )
}

// 星評価の表示（読み取り専用）
function StarRatingDisplay({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-sm ${i <= rating ? 'text-accent-warm' : 'text-text-sub/20'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

// 星評価の入力
function StarRatingInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(value === i ? null : i)}
          className={`text-2xl transition-all duration-150 hover:scale-110 ${
            value && i <= value ? 'text-accent-warm' : 'text-text-sub/20 hover:text-accent-warm/50'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// 日付フォーマット
function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

// 今日の日付（YYYY-MM-DD）
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Props = {
  records: CookingRecord[]
}

export default function CookingPageClient({ records }: Props) {
  const router = useRouter()
  const { user, profile } = useAuth()

  // リアルタイム監視

  // モーダル状態
  const [showForm, setShowForm] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<CookingRecord | null>(null)
  const [editingRecord, setEditingRecord] = useState<CookingRecord | null>(null)

  // フォーム状態
  const [title, setTitle] = useState('')
  const [cookedDate, setCookedDate] = useState(todayStr())
  const [ingredients, setIngredients] = useState<string[]>([''])
  const [recipe, setRecipe] = useState<string[]>([''])
  const [tips, setTips] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // フォームを初期化
  const resetForm = useCallback(() => {
    setTitle('')
    setCookedDate(todayStr())
    setIngredients([''])
    setRecipe([''])
    setTips('')
    setRating(null)
    setComment('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setEditingRecord(null)
  }, [])

  // 新規作成モーダルを開く
  const openCreateForm = useCallback(() => {
    resetForm()
    setShowForm(true)
  }, [resetForm])

  // 編集モーダルを開く
  const openEditForm = useCallback((record: CookingRecord) => {
    setEditingRecord(record)
    setTitle(record.title)
    setCookedDate(record.cooked_date)
    try { setIngredients(record.ingredients ? JSON.parse(record.ingredients) : ['']) } catch { setIngredients(record.ingredients ? [record.ingredients] : ['']) }
    try { setRecipe(record.recipe ? JSON.parse(record.recipe) : ['']) } catch { setRecipe(record.recipe ? [record.recipe] : ['']) }
    setTips(record.tips || '')
    setRating(record.rating)
    setComment(record.comment || '')
    setPhotoFile(null)
    setPhotoPreview(record.photo_path ? getPhotoUrl(record.photo_path) : null)
    setSelectedRecord(null)
    setShowForm(true)
  }, [])

  // 写真選択
  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    // プレビュー生成
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  // 保存処理
  const handleSave = useCallback(async () => {
    if (!title.trim() || !user) return
    setIsSaving(true)

    try {
      if (editingRecord) {
        // 更新処理
        const updateData: Record<string, unknown> = {
          title: title.trim(),
          cooked_date: cookedDate,
          ingredients: ingredients.filter(s => s.trim()).length > 0 ? JSON.stringify(ingredients.filter(s => s.trim())) : null,
          recipe: recipe.filter(s => s.trim()).length > 0 ? JSON.stringify(recipe.filter(s => s.trim())) : null,
          tips: tips.trim() || null,
          rating: rating,
          comment: comment.trim() || null,
        }

        // 新しい写真がある場合はアップロード
        if (photoFile) {
          const ext = photoFile.name.split('.').pop()
          const path = `cooking/${editingRecord.id}/${Date.now()}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('scouting-photos')
            .upload(path, photoFile, { upsert: true })
          if (uploadError) throw uploadError
          updateData.photo_path = path
        }

        const { error } = await supabase
          .from('cooking_records')
          .update(updateData)
          .eq('id', editingRecord.id)
        if (error) throw error
      } else {
        // 新規作成: まずレコードをINSERT
        const { data: newRecord, error: insertError } = await supabase
          .from('cooking_records')
          .insert({
            user_id: user.id,
            title: title.trim(),
            cooked_date: cookedDate,
            ingredients: ingredients.filter(s => s.trim()).length > 0 ? JSON.stringify(ingredients.filter(s => s.trim())) : null,
            recipe: recipe.filter(s => s.trim()).length > 0 ? JSON.stringify(recipe.filter(s => s.trim())) : null,
            tips: tips.trim() || null,
            rating: rating,
            comment: comment.trim() || null,
          })
          .select()
          .single()

        if (insertError || !newRecord) throw insertError

        // 写真があればStorageにアップロードしてパスを更新
        if (photoFile) {
          const ext = photoFile.name.split('.').pop()
          const path = `cooking/${newRecord.id}/${Date.now()}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('scouting-photos')
            .upload(path, photoFile)
          if (uploadError) throw uploadError

          const { error: updateError } = await supabase
            .from('cooking_records')
            .update({ photo_path: path })
            .eq('id', newRecord.id)
          if (updateError) throw updateError
        }
      }

      setShowForm(false)
      resetForm()
      router.refresh()
    } catch (err) {
      console.error('保存エラー:', err)
      alert('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }, [title, cookedDate, ingredients, recipe, tips, rating, comment, photoFile, user, editingRecord, resetForm, router])

  // 削除処理
  const handleDelete = useCallback(async (record: CookingRecord) => {
    if (!confirm('この記録を削除しますか？')) return
    setIsDeleting(true)

    try {
      // Storageの写真を削除（ある場合）
      if (record.photo_path) {
        await supabase.storage.from('scouting-photos').remove([record.photo_path])
      }

      const { error } = await supabase
        .from('cooking_records')
        .delete()
        .eq('id', record.id)
      if (error) throw error

      setSelectedRecord(null)
      router.refresh()
    } catch (err) {
      console.error('削除エラー:', err)
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }, [router])

  return (
    <div className="px-2 sm:px-6 pb-24 md:pb-8">
      {/* 記録するボタン */}
      <div className="flex justify-center mb-6">
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          記録する
        </button>
      </div>

      {/* 空の状態 */}
      {records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 max-w-6xl mx-auto">
          <div className="bg-primary-light/20 rounded-full p-6 mb-5">
            <svg className="w-16 h-16 text-text-sub/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p className="text-text-sub text-sm text-center">まだ記録がないよ。最初の料理を記録しよう！</p>
        </div>
      )}

      {/* カードグリッド */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {records.map((record) => (
            <button
              key={record.id}
              onClick={() => setSelectedRecord(record)}
              className="bg-bg-card rounded-2xl overflow-hidden shadow-sm border border-primary-light/30 text-left hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              {/* 写真 */}
              <div className="aspect-[4/3] bg-primary-light/10 relative overflow-hidden">
                {record.photo_path ? (
                  <Image
                    src={getPhotoUrl(record.photo_path)}
                    alt={record.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-text-sub/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* カード内容 */}
              <div className="p-3.5">
                {/* 料理名 */}
                <h3 className="font-bold text-text text-sm mb-1.5 line-clamp-1">{record.title}</h3>

                {/* ユーザー情報と日付 */}
                <div className="flex items-center gap-2 mb-1.5">
                  <AvatarDisplay avatar={record.profiles?.avatar_emoji ?? null} size={22} />
                  <span className="text-xs text-text-sub truncate">{record.profiles?.display_name ?? '不明'}</span>
                  <span className="text-xs text-text-sub/50 ml-auto shrink-0">{formatDate(record.cooked_date)}</span>
                </div>

                {/* 星評価 */}
                {record.rating && (
                  <div className="mb-1">
                    <StarRatingDisplay rating={record.rating} />
                  </div>
                )}

                {/* 感想プレビュー */}
                {record.comment && (
                  <p className="text-xs text-text-sub/70 line-clamp-1">{record.comment}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-bg-card w-full max-w-lg md:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 写真 */}
            {selectedRecord.photo_path && (
              <div className="aspect-[4/3] relative overflow-hidden md:rounded-t-2xl">
                <Image
                  src={getPhotoUrl(selectedRecord.photo_path)}
                  alt={selectedRecord.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 512px"
                />
              </div>
            )}

            <div className="p-5">
              {/* 料理名 */}
              <h2 className="text-lg font-bold text-text mb-2">{selectedRecord.title}</h2>

              {/* ユーザー・日付 */}
              <div className="flex items-center gap-2 mb-4">
                <AvatarDisplay avatar={selectedRecord.profiles?.avatar_emoji ?? null} size={28} />
                <span className="text-sm text-text-sub">{selectedRecord.profiles?.display_name ?? '不明'}</span>
                <span className="text-xs text-text-sub/50 ml-auto">{formatDate(selectedRecord.cooked_date)}</span>
              </div>

              {/* 星評価 */}
              {selectedRecord.rating && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">⭐</span>
                    <span className="text-xs font-medium text-text-sub">評価</span>
                  </div>
                  <StarRatingDisplay rating={selectedRecord.rating} />
                </div>
              )}

              {/* 材料 */}
              {selectedRecord.ingredients && (() => {
                let items: string[]
                try { items = JSON.parse(selectedRecord.ingredients) } catch { items = [selectedRecord.ingredients] }
                return items.filter(s => s.trim()).length > 0 ? (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">📝</span>
                      <span className="text-xs font-medium text-text-sub">材料</span>
                    </div>
                    <ul className="text-sm text-text bg-primary-light/10 rounded-xl p-3 space-y-0.5">
                      {items.filter(s => s.trim()).map((item, i) => (
                        <li key={i}>・{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null
              })()}

              {/* 作り方 */}
              {selectedRecord.recipe && (() => {
                let steps: string[]
                try { steps = JSON.parse(selectedRecord.recipe) } catch { steps = [selectedRecord.recipe] }
                return steps.filter(s => s.trim()).length > 0 ? (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">👨‍🍳</span>
                      <span className="text-xs font-medium text-text-sub">作り方</span>
                    </div>
                    <ol className="text-sm text-text bg-primary-light/10 rounded-xl p-3 space-y-1">
                      {steps.filter(s => s.trim()).map((step, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-medium text-primary shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null
              })()}

              {/* コツ */}
              {selectedRecord.tips && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">💡</span>
                    <span className="text-xs font-medium text-text-sub">コツ・ポイント</span>
                  </div>
                  <p className="text-sm text-text whitespace-pre-wrap bg-primary-light/10 rounded-xl p-3">
                    {selectedRecord.tips}
                  </p>
                </div>
              )}

              {/* 感想 */}
              {selectedRecord.comment && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">💬</span>
                    <span className="text-xs font-medium text-text-sub">感想・メモ</span>
                  </div>
                  <p className="text-sm text-text whitespace-pre-wrap bg-primary-light/10 rounded-xl p-3">
                    {selectedRecord.comment}
                  </p>
                </div>
              )}

              {/* アクションボタン（自分の投稿のみ） */}
              {user && selectedRecord.user_id === user.id && (
                <div className="flex gap-2 mt-5 pt-4 border-t border-primary-light/30">
                  <button
                    onClick={() => openEditForm(selectedRecord)}
                    className="flex-1 py-2.5 rounded-xl bg-primary-light/30 text-primary text-sm font-medium hover:bg-primary-light/50 transition-colors"
                  >
                    編集する
                  </button>
                  <button
                    onClick={() => handleDelete(selectedRecord)}
                    disabled={isDeleting}
                    className="px-4 py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? '削除中...' : '削除'}
                  </button>
                </div>
              )}

              {/* 閉じるボタン */}
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full mt-3 py-2.5 rounded-xl text-text-sub text-sm hover:bg-primary-light/20 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 投稿フォームモーダル */}
      {showForm && (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => { setShowForm(false); resetForm() }}
        >
          <div
            className="bg-bg-card w-full max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* フォームヘッダー */}
            <div className="sticky top-0 bg-bg-card border-b border-primary-light/30 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-bold text-text">
                {editingRecord ? '記録を編集' : '料理を記録する'}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="p-1 text-text-sub hover:text-text transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* 写真アップロード */}
              <div>
                <label className="text-xs font-medium text-text-sub mb-2 block">📷 写真</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                {photoPreview ? (
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-primary-light/10">
                    <img src={photoPreview} alt="プレビュー" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-primary-light/50 bg-primary-light/5 flex flex-col items-center justify-center gap-2 hover:bg-primary-light/10 hover:border-primary/30 transition-all"
                  >
                    <svg className="w-8 h-8 text-text-sub/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-text-sub/50">タップして写真を選択</span>
                  </button>
                )}
              </div>

              {/* 料理名（必須） */}
              <div>
                <label className="text-xs font-medium text-text-sub mb-1.5 block">🍳 料理名 <span className="text-accent">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: チキン南蛮"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primary-light/40 bg-white/80 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-text-sub/30"
                />
              </div>

              {/* 作った日 */}
              <div>
                <label className="text-xs font-medium text-text-sub mb-1.5 block">📅 作った日</label>
                <input
                  type="date"
                  value={cookedDate}
                  onChange={(e) => setCookedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primary-light/40 bg-white/80 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                />
              </div>

              {/* 使った材料（項目追加式） */}
              <div>
                <label className="text-xs font-medium text-text-sub mb-1.5 block">📝 使った材料</label>
                <div className="space-y-1.5">
                  {ingredients.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-xs text-text-sub/40 w-4 shrink-0 text-right">・</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const next = [...ingredients]
                          next[i] = e.target.value
                          setIngredients(next)
                        }}
                        placeholder={i === 0 ? '例: 鶏もも肉 300g' : '材料を追加...'}
                        className="flex-1 px-3 py-2 rounded-lg border border-primary-light/40 bg-white/80 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-text-sub/30"
                      />
                      {ingredients.length > 1 && (
                        <button onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))} className="text-text-sub/30 hover:text-accent text-xs p-1">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setIngredients([...ingredients, ''])}
                  className="mt-1.5 text-xs text-primary/60 hover:text-primary transition-colors"
                >
                  + 材料を追加
                </button>
              </div>

              {/* 作り方・手順（番号付き項目追加式） */}
              <div>
                <label className="text-xs font-medium text-text-sub mb-1.5 block">👨‍🍳 作り方・手順</label>
                <div className="space-y-1.5">
                  {recipe.map((step, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-primary/60 w-5 shrink-0 text-right">{i + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => {
                          const next = [...recipe]
                          next[i] = e.target.value
                          setRecipe(next)
                        }}
                        placeholder={i === 0 ? '例: 鶏肉を一口大に切る' : '次の手順...'}
                        className="flex-1 px-3 py-2 rounded-lg border border-primary-light/40 bg-white/80 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-text-sub/30"
                      />
                      {recipe.length > 1 && (
                        <button onClick={() => setRecipe(recipe.filter((_, j) => j !== i))} className="text-text-sub/30 hover:text-accent text-xs p-1">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setRecipe([...recipe, ''])}
                  className="mt-1.5 text-xs text-primary/60 hover:text-primary transition-colors"
                >
                  + 手順を追加
                </button>
              </div>

              {/* コツ・ポイント */}
              <div>
                <label className="text-xs font-medium text-text-sub mb-1.5 block">💡 コツ・ポイント</label>
                <textarea
                  value={tips}
                  onChange={(e) => setTips(e.target.value)}
                  placeholder="例: 弱火でじっくり焼くと柔らかくなる"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primary-light/40 bg-white/80 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-text-sub/30 resize-none"
                />
              </div>

              {/* 評価 */}
              <div>
                <label className="text-xs font-medium text-text-sub mb-1.5 block">⭐ 評価</label>
                <StarRatingInput value={rating} onChange={setRating} />
              </div>

              {/* 感想・メモ */}
              <div>
                <label className="text-xs font-medium text-text-sub mb-1.5 block">💬 感想・メモ</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="例: 一緒に住んだらあいりちゃんに絶対作ってあげたい"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-primary-light/40 bg-white/80 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-text-sub/30 resize-none"
                />
              </div>

              {/* 保存ボタン */}
              <button
                onClick={handleSave}
                disabled={!title.trim() || isSaving}
                className="w-full py-3 rounded-xl bg-primary text-white text-sm font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
              >
                {isSaving ? '保存中...' : editingRecord ? '更新する' : '記録する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
