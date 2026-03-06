import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Covenant - Marriage Companion App',
  description: 'Strengthen your marriage through daily connection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream">
        {children}
      </body>
    </html>
  )
}
