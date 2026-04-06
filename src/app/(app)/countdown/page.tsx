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
  // settingsテーブルの value は JSONB型。seed.sqlでは '"2027-07-15"' のように
  // 文字列がそのままJSON値として格納される。UIからは { value: "..." } の形式で保存される。
  // どちらの形式でも正しく取り出す。
  const settingsMap: Record<string, string> = {}
  settings?.forEach((s) => {
    const raw = s.value
    if (typeof raw === 'string') {
      // seed.sql形式: JSONBに文字列が直接格納されている（例: "2027-07-15"）
      settingsMap[s.key] = raw
    } else if (raw && typeof raw === 'object' && 'value' in raw) {
      // UI保存形式: { value: "実際の値" }
      const val = (raw as Record<string, unknown>).value
      if (typeof val === 'string') {
        settingsMap[s.key] = val
      }
    }
  })

  const moveInDate = settingsMap['move_in_date'] || ''
  const frierenDate = settingsMap['frieren_date'] || ''
  const messageShingo = settingsMap['message_shingo'] || ''
  const messageAiri = settingsMap['message_airi'] || ''

  // データ取得に失敗した場合のフォールバック表示
  if (!settings) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <TimeGradient />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
          <div className="bg-bg-card/80 backdrop-blur-xl rounded-2xl px-8 py-10 shadow-sm border border-primary-light/30 text-center max-w-sm">
            <svg className="w-12 h-12 mx-auto mb-4 text-text-sub/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-text-sub text-sm">データの読み込みに失敗しました</p>
            <p className="text-text-sub/60 text-xs mt-1">ページをリロードしてみてね</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="countdown-container relative min-h-screen overflow-hidden">
      {/* 時間帯に応じた背景グラデーション（夜間はCSS変数を上書きして白テキストに切替） */}
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
