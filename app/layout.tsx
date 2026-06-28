import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Nunito } from 'next/font/google'
import './globals.css'
import PushSubscriptionManager from './components/PushSubscriptionManager'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pope Nails — Agenda de Citas',
  description: 'Agenda de citas para Pope Nails, tu emprendimiento de uñas profesional.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pope Nails',
  },
}

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${nunito.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pope Nails" />
        <meta name="theme-color" content="#FFFFFF" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={nunito.className}>
        <PushSubscriptionManager />
        {children}
      </body>
    </html>
  )
}
