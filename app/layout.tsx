import type { Metadata } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import Providers from './providers'
import './globals.css'

const cormorant = Cormorant_Garamond({
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'oneQ',
  description: 'An introspective emotional companion — powered by ElizaOS on Nosana',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cormorant.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
