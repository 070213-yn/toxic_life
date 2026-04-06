import { createClient } from '@/lib/supabase/server'
import { CountdownDisplay } from '@/components/countdown/CountdownDisplay'
import { SubCountdown } from '@/components/countdown/SubCountdown'
import { MessageBoard } from '@/components/countdown/MessageBoard'
import { TimeGradient } from '@/components/countdown/TimeGradient'

// カウントダウンページ（サーバーコンポーネント）
// settingsテーブルから引越し日、フリーレン日、メッセージを取得
export default async function CountdownPage() {
  const supabase = await createClient()

  // 設定値を一括取得
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
      'move_in_date',
      'frieren_date',
      'message_shingo',
      'message_airi',
    ])

  // key-valueの形に変換
  const settingsMap: Record<string, string> = {}
  settings?.forEach((s) => {
    // value は { value: "実際の値" } のようなJSON形式を想定
    const val = (s.value as Record<string, unknown>)?.value
    if (typeof val === 'string') {
      settingsMap[s.key] = val
    }
  })

  const moveInDate = settingsMap['move_in_date'] || ''
  const frierenDate = settingsMap['frieren_date'] || ''
  const messageShingo = settingsMap['message_shingo'] || ''
  const messageAiri = settingsMap['message_airi'] || ''

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 時間帯に応じた背景グラデーション */}
      <TimeGradient />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 gap-8">
        {/* メインカウントダウン */}
        <CountdownDisplay targetDate={moveInDate} />

        {/* サブカウントダウン（フリーレン3期） */}
        {frierenDate && <SubCountdown targetDate={frierenDate} />}

        {/* メッセージボード */}
        <MessageBoard
          initialShingo={messageShingo}
          initialAiri={messageAiri}
        />
      </div>
    </div>
  )
}
