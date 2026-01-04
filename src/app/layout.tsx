import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mobie2Text - 動画文字起こし',
  description: 'YouTube動画を簡単に文字起こし。URLを入力するだけ。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
