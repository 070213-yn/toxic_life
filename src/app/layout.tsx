import type { Metadata } from 'next'
import { Quicksand, Zen_Maru_Gothic, DM_Sans } from 'next/font/google'
import './globals.css'

// 見出し英字用フォント
const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

// 日本語本文用フォント
const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-zen-maru',
  display: 'swap',
})

// 数字表示用フォント
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '卍Toxic Life卍',
  description: '同棲準備トラッカー',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      className={`${quicksand.variable} ${zenMaruGothic.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-zen-maru)]">
        {children}
      </body>
    </html>
  )
}
