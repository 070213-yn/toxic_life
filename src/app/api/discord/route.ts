import { NextResponse } from 'next/server'

// Discord Webhook経由でメッセージを送信・削除するAPI Route
export async function POST(request: Request) {
  const { message, username, action, messageId } = await request.json()

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    // メッセージ削除
    if (action === 'delete' && messageId) {
      await fetch(`${webhookUrl}/messages/${messageId}`, {
        method: 'DELETE',
      })
      return NextResponse.json({ ok: true, deleted: true })
    }

    // メッセージ送信（?wait=true でメッセージIDを取得）
    const res = await fetch(`${webhookUrl}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `@everyone\n${message}`,
        username: username || '卍Toxic Life卍',
        avatar_url: 'https://toxiclife.vercel.app/images/couple2.jpg',
      }),
    })

    const data = await res.json()
    return NextResponse.json({ ok: true, messageId: data.id })
  } catch (error) {
    console.error('Discord Webhook送信エラー:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
