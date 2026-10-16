import type { Metadata, Viewport } from 'next'
import './globals.css'
import PushSubscriptionManager from './components/PushSubscriptionManager'
import { cormorant, cinzel, nunito } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Pope Nails — Agenda de Citas',
  description: 'Agenda de citas para Pope Nails, tu emprendimiento de uñas profesional.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pope Nails',
  },
}

export const viewport: Viewport = {
  themeColor: '#100e13',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${cormorant.variable} ${cinzel.variable} ${nunito.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pope Nails" />
        <link rel="apple-touch-icon" href="/icon-192.jpg" />
      </head>
      <body className={`${nunito.className} bg-pn-ivory text-pn-text`}>
        <PushSubscriptionManager />
        {children}
      </body>
    </html>
  )
}
