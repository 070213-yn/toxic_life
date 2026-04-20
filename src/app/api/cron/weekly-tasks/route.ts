import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron Job: 毎週月曜17:00 JST (08:00 UTC) に実行
// 現在のチャプターの未完了タスクを人物別にDiscord通知

export async function GET(request: Request) {
  // Cron認証
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 現在（最初の未完了）チャプターを取得
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*, tasks(*)')
    .eq('is_completed', false)
    .order('sort_order', { ascending: true })
    .limit(1)

  if (!milestones || milestones.length === 0) {
    return NextResponse.json({ ok: true, message: 'No active chapter' })
  }

  const currentMs = milestones[0]
  const tasks = (currentMs.tasks || []) as { title: string; is_completed: boolean; assignee: string }[]
  const incompleteTasks = tasks.filter((t) => !t.is_completed)

  if (incompleteTasks.length === 0) {
    return NextResponse.json({ ok: true, message: 'No incomplete tasks' })
  }

  // 人物別にグループ化
  const byAssignee: Record<string, string[]> = {}
  for (const t of incompleteTasks) {
    if (!byAssignee[t.assignee]) byAssignee[t.assignee] = []
    byAssignee[t.assignee].push(t.title)
  }

  // 期限までの日数
  let deadlineInfo = ''
  if (currentMs.deadline) {
    const deadline = new Date(currentMs.deadline)
    const now = new Date()
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    deadlineInfo = `期限: ${currentMs.deadline}（残り${daysLeft}日）\n`
  }

  let msg = `@everyone\n📋 **今週のタスク** - ${currentMs.subtitle || ''} ${currentMs.title}\n${deadlineInfo}\n`

  // 人物別にタスクを列挙
  const order = ['しんご', 'あいり', '2人で', '2人共通', '各自']
  const assignees = Object.keys(byAssignee).sort((a, b) => {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  for (const assignee of assignees) {
    msg += `【${assignee}】\n`
    byAssignee[assignee].forEach((t) => { msg += `・${t}\n` })
    msg += `\n`
  }

  msg += `[タスクを確認 →](https://toxiclife.vercel.app/quests)`

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: msg,
        username: '卍Toxic Life卍',
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, taskCount: incompleteTasks.length })
}
