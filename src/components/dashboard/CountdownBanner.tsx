'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Props = {
  moveInDate: string | null
}

function calcDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function CountdownBanner({ moveInDate }: Props) {
  const router = useRouter()
  const moveInDays = useMemo(() => calcDaysLeft(moveInDate), [moveInDate])

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

  if (editing) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-sm">
        <div className="absolute inset-0">
          <Image src="/images/couple2.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm" />
        </div>
        <div className="relative p-4 space-y-3">
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

  if (moveInDays === null) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-sm cursor-pointer" onClick={() => setEditing(true)}>
        <div className="absolute inset-0">
          <Image src="/images/couple2.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/50 via-purple-400/40 to-pink-400/30" />
        </div>
        <div className="relative p-4 text-center">
          <p className="text-white/90 text-sm mb-1">同棲開始まで</p>
          <p className="text-white text-sm">タップして日付を設定</p>
        </div>
      </div>
    )
  }

  if (moveInDays < 0) {
    return (
      <div className="rounded-2xl bg-accent/20 p-4 text-center shadow-sm">
        <p className="text-text text-lg font-bold">新生活スタートおめでとう!</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer" onClick={() => setEditing(true)}>
      {/* 背景写真 */}
      <div className="absolute inset-0">
        <Image src="/images/couple2.jpg" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/55 via-purple-500/45 to-pink-400/35" />
      </div>

      {/* コンテンツ */}
      <div className="relative px-5 py-4 text-center">
        <p className="text-white/85 text-xs font-medium tracking-wide mb-1">同棲開始まで</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-white text-6xl font-extrabold tracking-tight leading-none drop-shadow-md">
            {moveInDays}
          </span>
          <span className="text-white/90 text-lg font-medium">日</span>
        </div>
      </div>

      {/* ホバー時の編集ヒント */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
        <span className="text-white/90 text-[10px] bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">日付を編集</span>
      </div>
    </div>
  )
}
