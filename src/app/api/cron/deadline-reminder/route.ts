import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel Cron Job: 毎日朝9時に実行
// チャプター期限の10日前・7日前・3日前に未完了タスクをDiscord通知

export async function GET(request: Request) {
  // Cron認証（Vercelが自動で付与するヘッダー）
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Supabaseクライアント（サーバーサイド、service roleは不要、anon keyで十分）
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // 未完了マイルストーン（期限付き）を取得
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*, tasks(*)')
    .eq('is_completed', false)
    .not('deadline', 'is', null)
    .order('sort_order', { ascending: true })

  if (!milestones || milestones.length === 0) {
    return NextResponse.json({ ok: true, message: 'No milestones' })
  }

  const messages: string[] = []

  for (const ms of milestones) {
    const deadline = new Date(ms.deadline)
    deadline.setHours(0, 0, 0, 0)
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // 10日前、7日前、3日前のみ通知
    if (daysLeft !== 10 && daysLeft !== 7 && daysLeft !== 3) continue

    const tasks = (ms.tasks || []) as { title: string; is_completed: boolean; assignee: string }[]
    const incompleteTasks = tasks.filter((t) => !t.is_completed)

    if (incompleteTasks.length === 0) continue

    // 緊急度に応じた絵文字
    const emoji = daysLeft <= 3 ? '🔴' : daysLeft <= 7 ? '🟡' : '🔵'
    const urgency = daysLeft <= 3 ? '残り3日！' : daysLeft <= 7 ? '残り1週間' : 'あと10日'

    let msg = `${emoji} **${ms.subtitle || ''} ${ms.title}** の期限まで **${urgency}**（${ms.deadline}）\n`
    msg += `未完了タスク ${incompleteTasks.length}件:\n`

    incompleteTasks.forEach((t) => {
      msg += `　・${t.title}（${t.assignee}）\n`
    })

    messages.push(msg)
  }

  // 貯金進捗チェック
  const { data: savings } = await supabase.from('savings').select('amount')
  const totalSavings = savings?.reduce((s, r) => s + (r.amount || 0), 0) ?? 0

  // 次のマイルストーンの貯金目標
  const nextMs = milestones[0]
  if (nextMs?.savings_goal && totalSavings < nextMs.savings_goal) {
    const remaining = nextMs.savings_goal - totalSavings
    const deadline = new Date(nextMs.deadline)
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft === 10 || daysLeft === 7 || daysLeft === 3) {
      messages.push(`💰 貯金目標まであと **¥${remaining.toLocaleString()}** 必要です（現在 ¥${totalSavings.toLocaleString()} / ¥${nextMs.savings_goal.toLocaleString()}）`)
    }
  }

  // 週の始まり（月曜日）に今週のタスクサマリーを送信
  if (now.getDay() === 1) {
    const allIncompleteTasks = milestones.flatMap((ms) =>
      ((ms.tasks || []) as { title: string; is_completed: boolean; assignee: string }[])
        .filter((t) => !t.is_completed)
    )

    if (allIncompleteTasks.length > 0) {
      let weeklyMsg = `📋 **今週のやること** (未完了 ${allIncompleteTasks.length}件)\n`
      const byAssignee: Record<string, string[]> = {}
      allIncompleteTasks.forEach((t) => {
        if (!byAssignee[t.assignee]) byAssignee[t.assignee] = []
        byAssignee[t.assignee].push(t.title)
      })
      Object.entries(byAssignee).forEach(([assignee, tasks]) => {
        weeklyMsg += `\n**${assignee}:**\n`
        tasks.slice(0, 5).forEach((t) => { weeklyMsg += `　・${t}\n` })
        if (tasks.length > 5) weeklyMsg += `　...他${tasks.length - 5}件\n`
      })
      messages.push(weeklyMsg)
    }
  }

  if (messages.length === 0) {
    return NextResponse.json({ ok: true, message: 'No notifications needed' })
  }

  // Discord送信
  const fullMessage = messages.join('\n---\n')
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: fullMessage,
        username: '卍Toxic Life卍',
      }),
    })
  } catch (e) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sent: messages.length })
}
