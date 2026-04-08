// Discord通知を送信するヘルパー（メッセージIDを返す）
export async function notifyDiscord(message: string, username?: string): Promise<string | null> {
  try {
    const res = await fetch('/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, username }),
    })
    const data = await res.json()
    return data.messageId || null
  } catch {
    return null
  }
}

// Discord通知メッセージを削除するヘルパー
export async function deleteDiscordMessage(messageId: string): Promise<void> {
  try {
    await fetch('/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', messageId }),
    })
  } catch {
    // 削除失敗は握りつぶす
  }
}
