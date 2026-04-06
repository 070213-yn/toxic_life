'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Profile, Task } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'
import { TaskReactions } from '@/components/quests/TaskReactions'

type Props = {
  tasks: Task[]
  totalSavings: number
  savingsGoal: number | null
  onTaskUpdate: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onAllTasksComplete: () => void
  profiles: Profile[] // 担当者のアバター表示用
}

// 担当者のグループ定義（複数の値をまとめてグループ化）
const ASSIGNEE_GROUPS = [
  { keys: ['しんご'], label: 'しんご' },
  { keys: ['あいり'], label: 'あいり' },
  { keys: ['2人共通', '2人で'], label: '2人で' },
  { keys: ['各自'], label: '各自' },
] as const

// 担当者別のスタイル定義（ラベルで引く）
const ASSIGNEE_STYLES: Record<string, {
  groupBg: string
  borderColor: string
  textColor: string
}> = {
  'しんご': {
    groupBg: 'bg-primary/[0.06]',
    borderColor: 'border-l-primary/60',
    textColor: 'text-primary',
  },
  'あいり': {
    groupBg: 'bg-accent/[0.06]',
    borderColor: 'border-l-accent/60',
    textColor: 'text-accent',
  },
  '2人で': {
    groupBg: 'bg-amber-500/[0.06]',
    borderColor: 'border-l-amber-400/60',
    textColor: 'text-text',
  },
  '各自': {
    groupBg: 'bg-primary/[0.04]',
    borderColor: 'border-l-text-sub/40',
    textColor: 'text-text',
  },
}

// 担当者名からプロフィールを検索するヘルパー
function findProfile(profiles: Profile[], assignee: string): Profile | undefined {
  // display_nameで一致を探す
  return profiles.find((p) => p.display_name === assignee)
}

// アバター表示コンポーネント（URLなら小さい丸画像、絵文字ならそのまま表示）
function AvatarIcon({ profile }: { profile: Profile | undefined }) {
  if (!profile?.avatar_emoji) return null

  // URLかどうか判定（http で始まるか）
  const isUrl = profile.avatar_emoji.startsWith('http')

  if (isUrl) {
    return (
      <img
        src={profile.avatar_emoji}
        alt={profile.display_name}
        className="w-4 h-4 rounded-full object-cover"
      />
    )
  }

  // 絵文字の場合
  return <span className="text-sm leading-none">{profile.avatar_emoji}</span>
}

// タスクリストコンポーネント
// 担当者別にグループ化して表示、チェックボックスで完了切り替え
export function TaskList({
  tasks,
  totalSavings,
  savingsGoal,
  onTaskUpdate,
  onTaskDelete,
  onAllTasksComplete,
  profiles,
}: Props) {
  // 前回の完了数を記録（全タスク完了検知用）
  const prevCompletedRef = useRef(tasks.filter((t) => t.is_completed).length)

  // 全タスク完了を検知
  useEffect(() => {
    const completedCount = tasks.filter((t) => t.is_completed).length
    const prevCompleted = prevCompletedRef.current
    prevCompletedRef.current = completedCount

    if (tasks.length > 0 && completedCount === tasks.length && prevCompleted < tasks.length) {
      onAllTasksComplete()
    }
  }, [tasks, onAllTasksComplete])

  // タスクの完了状態を切り替え
  const handleToggle = useCallback(
    async (task: Task) => {
      const newCompleted = !task.is_completed
      const updatedTask: Task = {
        ...task,
        is_completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      }

      // 楽観的UI更新
      onTaskUpdate(updatedTask)

      await supabase
        .from('tasks')
        .update({
          is_completed: newCompleted,
          completed_at: updatedTask.completed_at,
        })
        .eq('id', task.id)
    },
    [onTaskUpdate]
  )

  // タスク削除
  const handleDelete = useCallback(
    async (taskId: string) => {
      onTaskDelete(taskId)
      await supabase.from('tasks').delete().eq('id', taskId)
    },
    [onTaskDelete]
  )

  if (tasks.length === 0) {
    return (
      <p className="text-center text-text-sub text-sm py-6">
        まだタスクがありません
      </p>
    )
  }

  // 担当者ごとにグループ化（複数keyでマッチ）
  const groupedKnown = ASSIGNEE_GROUPS.map((group) => ({
    label: group.label,
    tasks: tasks.filter((t) => (group.keys as readonly string[]).includes(t.assignee)),
    profile: findProfile(profiles, group.label),
    styles: ASSIGNEE_STYLES[group.label] ?? ASSIGNEE_STYLES['2人で'],
  })).filter((g) => g.tasks.length > 0)

  // どのグループにも属さないタスクを「その他」としてまとめる
  const allGroupedKeys = ASSIGNEE_GROUPS.flatMap((g) => [...g.keys] as string[])
  const ungrouped = tasks.filter((t) => !allGroupedKeys.includes(t.assignee))
  const grouped = ungrouped.length > 0
    ? [...groupedKnown, { label: 'その他', tasks: ungrouped, profile: undefined, styles: ASSIGNEE_STYLES['2人で'] }]
    : groupedKnown

  return (
    <div className="pt-4 space-y-4">
      {grouped.map((group) => (
        <div
          key={group.label}
          className={`rounded-xl ${group.styles.groupBg} border-l-[3px] ${group.styles.borderColor} px-3 py-2.5`}
        >
          {/* 担当者ラベル（アバター付き） */}
          <p className="text-xs font-bold text-text-sub/80 mb-2 flex items-center gap-1.5">
            <AvatarIcon profile={group.profile} />
            {group.label}
          </p>

          {/* タスク一覧 */}
          <div className="space-y-1">
            {group.tasks.map((task) => (
              <div key={task.id}>
                <TaskItem
                  task={task}
                  totalSavings={totalSavings}
                  savingsGoal={savingsGoal}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  textColorClass={group.styles.textColor}
                />
                {/* 完了済みタスクにリアクション表示 */}
                <TaskReactions
                  taskId={task.id}
                  isCompleted={task.is_completed}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 個別タスクアイテム
// チェック時にバウンスアニメーション付き
function TaskItem({
  task,
  totalSavings,
  savingsGoal,
  onToggle,
  onDelete,
  textColorClass,
}: {
  task: Task
  totalSavings: number
  savingsGoal: number | null
  onToggle: (task: Task) => void
  onDelete: (taskId: string) => void
  textColorClass: string
}) {
  const [justChecked, setJustChecked] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const editRef = useRef<HTMLInputElement>(null)

  // タスク名を保存
  const saveTitle = useCallback(async () => {
    if (!editTitle.trim() || editTitle.trim() === task.title) {
      setEditTitle(task.title)
      setEditing(false)
      return
    }
    await supabase.from('tasks').update({ title: editTitle.trim() }).eq('id', task.id)
    setEditing(false)
    // ページ側でrefreshされるまでローカルで表示
  }, [editTitle, task.id, task.title])

  // 貯金連動タスクの自動判定
  const isAutoAchieved =
    task.is_auto_savings && savingsGoal !== null && totalSavings >= savingsGoal

  // チェック切り替え時にバウンスアニメーション
  const handleToggle = useCallback(() => {
    if (!task.is_completed) {
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 400)
    }
    onToggle(task)
  }, [task, onToggle])

  // 貯金連動タスクの進捗計算
  const savingsProgress = task.is_auto_savings && savingsGoal
    ? Math.min(totalSavings / savingsGoal, 1)
    : null

  const formatYen = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`

  return (
    <div
      className={`group flex items-start gap-3 py-2 px-3 rounded-xl transition-all duration-200 hover:bg-white/40 ${
        task.is_completed ? 'opacity-50' : ''
      }`}
    >
      {/* チェックボックス（丸型） */}
      <button
        onClick={handleToggle}
        disabled={task.is_auto_savings}
        className={`shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          task.is_completed || isAutoAchieved
            ? 'bg-success border-success'
            : 'border-text-sub/30 hover:border-primary'
        } ${task.is_auto_savings ? 'cursor-default' : 'cursor-pointer active:scale-[0.85]'}`}
        style={{
          animation: justChecked ? 'check-bounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}
      >
        {(task.is_completed || isAutoAchieved) && (
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>

      {/* タスク内容 */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={editRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); saveTitle() }
              if (e.key === 'Escape') { setEditTitle(task.title); setEditing(false) }
            }}
            autoFocus
            className="w-full text-sm px-1.5 py-0.5 rounded border border-primary/30 bg-white/80 text-text focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        ) : (
          <p
            onDoubleClick={() => { if (!task.is_completed) { setEditing(true); setTimeout(() => editRef.current?.focus(), 50) } }}
            className={`text-sm leading-snug transition-all duration-300 cursor-text ${
              task.is_completed ? 'line-through text-text-sub' : textColorClass
            }`}
            title="ダブルクリックで編集"
          >
            {editTitle}
          </p>
        )}

        {/* 貯金連動タスクのプログレスバー */}
        {task.is_auto_savings && savingsGoal && savingsProgress !== null && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-success/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-success/60 to-success transition-all duration-500"
                style={{ width: `${savingsProgress * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-text-sub shrink-0">
              {formatYen(totalSavings)}/{formatYen(savingsGoal)}
            </span>
          </div>
        )}

        {/* メモ */}
        {task.memo && (
          <p className="text-xs text-text-sub/70 mt-0.5 truncate">{task.memo}</p>
        )}
      </div>

      {/* 自動判定バッジ */}
      {task.is_auto_savings && (
        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
          </svg>
          自動
        </span>
      )}

      {/* 削除ボタン（ホバー時表示） */}
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-text-sub/40 hover:text-accent transition-all duration-200 p-1 mt-0.5"
        aria-label="タスクを削除"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  )
}
