'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Props = {
  moveInDate: string | null
}

// カウントダウン用の写真リスト
const COUNTDOWN_PHOTOS = [
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_10.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_11.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_12.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_13.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_15.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_16.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_17.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_29.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_30.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_33.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_40.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_44.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_45.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_8.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_86.jpg',
  '/images/countdown/LINE_ALBUM_プリント倶楽部_260406_9.jpg',
]

// 完全ランダムに写真を選ぶ
function getRandomPhoto(): string {
  return COUNTDOWN_PHOTOS[Math.floor(Math.random() * COUNTDOWN_PHOTOS.length)]
}

function calcDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// テキストシャドウスタイル
const textShadow = '0 2px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)'

export default function CountdownBanner({ moveInDate }: Props) {
  const router = useRouter()
  const moveInDays = calcDaysLeft(moveInDate)
  // 2枚の画像を交互に切り替えてクロスフェード
  const [photoA, setPhotoA] = useState<string | null>(null)
  const [photoB, setPhotoB] = useState<string | null>(null)
  const [showA, setShowA] = useState(true)

  useEffect(() => {
    setPhotoA(getRandomPhoto())
    setPhotoB(getRandomPhoto())

    const interval = setInterval(() => {
      setShowA((prev) => {
        if (prev) {
          // 次はBを表示 → Aを裏で差し替え
          setPhotoB(getRandomPhoto())
        } else {
          // 次はAを表示 → Bを裏で差し替え
          setPhotoA(getRandomPhoto())
        }
        return !prev
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const photo = showA ? photoA : photoB

  const [editing, setEditing] = useState(false)
  const [newMoveIn, setNewMoveIn] = useState(moveInDate || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('settings').upsert(
      { key: 'move_in_date', value: { date: newMoveIn } },
      { onConflict: 'key' }
    )
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  // 編集フォーム
  if (editing) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="absolute inset-0">
          <Image src={photo || COUNTDOWN_PHOTOS[0]} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm" />
        </div>
        <div className="relative p-5 space-y-3 flex-1 flex flex-col justify-center">
          <div>
            <label className="block text-xs text-text-sub mb-1">引越し予定日</label>
            <input
              type="date"
              value={newMoveIn}
              onChange={(e) => setNewMoveIn(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-primary-light/50 bg-bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-xs text-text-sub hover:bg-bg-card transition-colors">キャンセル</button>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
          </div>
        </div>
      </div>
    )
  }

  // 未設定
  if (moveInDays === null) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-sm cursor-pointer flex-1 flex flex-col" onClick={() => setEditing(true)}>
        <div className="absolute inset-0">
          <Image src={photo || COUNTDOWN_PHOTOS[0]} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/50 via-purple-500/40 to-pink-500/30" />
        </div>
        <div className="relative p-5 text-center flex-1 flex flex-col items-center justify-end pb-8">
          <p className="text-white text-sm font-medium" style={{ textShadow }}>同棲開始まで</p>
          <p className="text-white/80 text-xs mt-1" style={{ textShadow }}>タップして日付を設定</p>
        </div>
      </div>
    )
  }

  // 過去
  if (moveInDays < 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="absolute inset-0">
          <Image src={photo || COUNTDOWN_PHOTOS[0]} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/40 via-purple-500/30 to-pink-500/20" />
        </div>
        <div className="relative flex-1 flex items-center justify-center">
          <p className="text-white text-xl font-bold" style={{ textShadow }}>新生活スタート!</p>
        </div>
      </div>
    )
  }

  // メイン表示
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer flex-1 flex flex-col" onClick={() => setEditing(true)}>
      {/* 背景写真（クロスフェード） */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${showA ? 'opacity-100' : 'opacity-0'}`}>
          <Image src={photoA || COUNTDOWN_PHOTOS[0]} alt="" fill className="object-cover" priority />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${showA ? 'opacity-0' : 'opacity-100'}`}>
          <Image src={photoB || COUNTDOWN_PHOTOS[1]} alt="" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-700/50 via-purple-600/40 to-pink-500/30" />
      </div>

      {/* コンテンツ - 中央配置 */}
      <div className="relative px-5 flex-1 flex flex-col items-center justify-center">
        <p className="text-white/90 text-sm font-medium tracking-wide mb-2" style={{ textShadow }}>
          同棲開始まで
        </p>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-white font-extrabold tracking-tight leading-none" style={{ fontSize: 'clamp(4rem, 8vw, 5.5rem)', textShadow }}>
            {moveInDays}
          </span>
          <span className="text-white/90 text-2xl font-bold" style={{ textShadow }}>日</span>
        </div>
      </div>

      {/* ホバー時のみ編集ヒント */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm py-1.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white/90 text-[11px]">日付を編集</span>
      </div>
    </div>
  )
}
