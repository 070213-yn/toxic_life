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

    msg += `[タスクを確認 →](https://toxiclife.vercel.app/quests)`
    messages.push(msg)
  }

  // Amazonセール時期の買い物候補通知
  const SALE_SCHEDULE = [
    { month: 1, name: '初売りセール', timing: '初売りセール' },
    { month: 3, name: '新生活セール', timing: '新生活セール（3月）' },
    { month: 5, name: 'GWセール', timing: 'セールで早めに' },
    { month: 7, name: 'プライムデー', timing: 'プライムデー（7月）' },
    { month: 9, name: '季節先取りセール', timing: 'セールで早めに' },
    { month: 10, name: 'プライム感謝祭', timing: 'プライム感謝祭（10月）' },
    { month: 11, name: 'ブラックフライデー', timing: 'ブラックフライデー（11月）' },
  ]

  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()
  const sale = SALE_SCHEDULE.find((s) => s.month === currentMonth)

  if (sale && currentDay === 1) {
    // planned_timingがこのセールのtimingに一致するアイテムを取得
    const { data: saleItems } = await supabase
      .from('shopping_items')
      .select('name, planned_timing, shopping_candidates(product_name, price, is_selected)')
      .eq('planned_timing', sale.timing)
      .neq('status', 'purchased')

    if (saleItems && saleItems.length > 0) {
      let saleMsg = `🛒 **${sale.name}** が近づいています！買い物候補:\n`
      saleItems.forEach((item: { name: string; shopping_candidates?: { product_name: string; price: number | null; is_selected: boolean }[] | null }) => {
        const selected = item.shopping_candidates?.find((c: { is_selected: boolean }) => c.is_selected)
        if (selected) {
          saleMsg += `　✅ ${item.name} → ${selected.product_name}（¥${selected.price?.toLocaleString() ?? '未定'}）\n`
        } else {
          saleMsg += `　⬜ ${item.name}（候補未定）\n`
        }
      })
      saleMsg += `\n[買い物リストを確認 →](https://toxiclife.vercel.app/shopping)`
      messages.push(saleMsg)
    }
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
      messages.push(`💰 貯金目標まであと **¥${remaining.toLocaleString()}** 必要です（現在 ¥${totalSavings.toLocaleString()} / ¥${nextMs.savings_goal.toLocaleString()}）\n[貯金を確認 →](https://toxiclife.vercel.app/savings)`)
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
