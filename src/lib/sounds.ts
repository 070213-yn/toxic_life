// 効果音再生ヘルパー
// 各効果音をプリロードせず、再生時にAudioオブジェクトを作成（軽量化）

const SOUNDS = {
  pin: '/sounds/pin.mp3',       // マップでピン設置
  tab: '/sounds/tab.mp3',       // タブ切り替え、タスク追加
  check: '/sounds/check.mp3',   // タスク完了チェック
  delete: '/sounds/delete.mp3', // 削除
  swap: '/sounds/swap.mp3',     // 並び替え
  saving: '/sounds/saving.mp3', // 貯金記録
  focus: '/sounds/focus.mp3',   // マップPINフォーカス
  cooking1: '/sounds/cooking1.mp3', // 料理記録（1つ目）
} as const

type SoundName = keyof typeof SOUNDS

// キャッシュ（同じ音を連続再生する場合に再利用）
const cache = new Map<string, HTMLAudioElement>()

export function playSound(name: SoundName, volume = 0.5) {
  if (typeof window === 'undefined') return

  try {
    let audio = cache.get(name)
    if (!audio) {
      audio = new Audio(SOUNDS[name])
      cache.set(name, audio)
    }
    audio.volume = volume
    audio.currentTime = 0
    audio.play().catch(() => {})
  } catch {}
}

// 料理記録用: 2つの音を連続再生
export function playCookingSound() {
  playSound('cooking1', 0.5)
  setTimeout(() => playSound('check', 0.5), 800)
}
