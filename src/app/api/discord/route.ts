import { NextResponse } from 'next/server'

// Discord Webhook経由でメッセージを送信するAPI Route
export async function POST(request: Request) {
  const { message, username } = await request.json()

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    // Webhook URLが未設定の場合は静かに成功を返す
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message,
        username: username || '卍Toxic Life卍',
        avatar_url: 'https://toxiclife.vercel.app/images/couple2.jpg',
      }),
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    // 通知失敗はログに残すが、クライアントにはエラーを返さない
    console.error('Discord Webhook送信エラー:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
