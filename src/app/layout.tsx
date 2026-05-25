import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Textile ERP',
  description: 'Tekstil ishlab chiqarish boshqaruv tizimi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className={nunito.className} style={{ background: '#0d1117', color: '#e6edf3', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
