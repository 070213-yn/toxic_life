// Discord通知を送信するヘルパー
// 通知失敗はユーザー操作に影響させない（fire and forget）
export function notifyDiscord(message: string, username?: string) {
  try {
    fetch('/api/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, username }),
    }).catch(() => {
      // 通知失敗は握りつぶす
    })
  } catch {
    // 通知失敗は握りつぶす
  }
}
