import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ChatbotButton } from '@/components/chatbot-button'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'CRI - Centre Regional d\'Investissement',
  description: 'Plateforme de la Commission Regionale Unifiee d\'Investissement du Maroc. Procedures simplifiees et 100% en ligne.',
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <ChatbotButton />
        <Analytics />
      </body>
    </html>
  )
}
