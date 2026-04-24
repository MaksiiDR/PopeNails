'use client'

import { useEffect, useState } from 'react'
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
} from '@/lib/push'

type Status = 'idle' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'

/** Detect if running as installed PWA (standalone mode) */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Detect iOS device */
function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export default function PushSubscriptionManager() {
  const [status, setStatus] = useState<Status>('idle')
  const [visible, setVisible] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // iOS but NOT in standalone mode → show "add to home screen" guide
    if (isIOS() && !isStandalone()) {
      setShowIOSGuide(true)
      return
    }

    // Push not supported on this browser/OS (e.g. non-standalone iOS older than 16.4)
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    // Register SW and wait for it to be ready before checking permission
    registerServiceWorker().then(() => {
      const perm = Notification.permission
      if (perm === 'granted') {
        // Already granted — re-subscribe to ensure subscription is in Supabase
        subscribeToPush().then(() => setStatus('subscribed'))
      } else if (perm === 'denied') {
        setStatus('denied')
      } else {
        // Not yet decided — show the prompt banner after a short delay
        setTimeout(() => setVisible(true), 2000)
      }
    })
  }, [])

  const handleAllow = async () => {
    setStatus('loading')
    setVisible(false)

    // Wait for SW to be fully active before subscribing (critical on iOS)
    await navigator.serviceWorker.ready

    const perm = await requestNotificationPermission()
    if (perm !== 'granted') {
      setStatus('denied')
      return
    }

    const sub = await subscribeToPush()
    setStatus(sub ? 'subscribed' : 'unsubscribed')
  }

  const handleDismiss = () => {
    setVisible(false)
    setStatus('unsubscribed')
  }

  // ── iOS guide: must open from home screen icon ───────────────────────────────
  if (showIOSGuide) {
    return (
      <div
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[380px] z-50 px-4 animate-fade-in"
      >
        <div
          className="rounded-2xl p-4 flex items-start gap-3 shadow-lg"
          style={{
            backgroundColor: '#FFF7F5',
            border: '1.5px solid #F0D8D4',
            boxShadow: '0 8px 32px rgba(201, 123, 138, 0.25)',
          }}
        >
          <span className="text-2xl flex-shrink-0 mt-0.5">📲</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: '#4A2535' }}>
              Abre la app desde el ícono
            </p>
            <p className="text-xs mt-1 leading-snug" style={{ color: '#9B7B85' }}>
              Para recibir notificaciones en iPhone, abrí la app desde el ícono en tu pantalla de inicio (no desde Safari).
            </p>
            <p className="text-xs mt-1 leading-snug" style={{ color: '#9B7B85' }}>
              ¿No lo agregaste aún? Tocá el botón <strong>Compartir 〔⬆︎〕</strong> y luego <strong>«Agregar a pantalla de inicio»</strong>.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-3 w-full rounded-xl py-2 text-xs font-bold transition-all"
              style={{ backgroundColor: '#F0D8D4', color: '#4A2535' }}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Permission prompt banner (shown once, if permission is 'default') ──────
  if (visible && status === 'idle') {
    return (
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-4 pt-3 animate-fade-in"
        style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}
      >
        <div
          className="rounded-2xl p-4 flex items-start gap-3 shadow-lg"
          style={{
            backgroundColor: '#FFF7F5',
            border: '1.5px solid #F0D8D4',
            boxShadow: '0 8px 32px rgba(201, 123, 138, 0.2)',
          }}
        >
          <span className="text-2xl flex-shrink-0 mt-0.5">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: '#4A2535' }}>
              Activar recordatorios
            </p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: '#9B7B85' }}>
              Recibe notificaciones 24 h antes de cada cita para no olvidar ninguna.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                id="btn-allow-notifications"
                onClick={handleAllow}
                className="flex-1 rounded-xl py-2 text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#C97B8A' }}
              >
                Activar
              </button>
              <button
                id="btn-dismiss-notifications"
                onClick={handleDismiss}
                className="flex-1 rounded-xl py-2 text-xs font-bold transition-all hover:opacity-80"
                style={{ backgroundColor: '#F0D8D4', color: '#4A2535' }}
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Subscribed confirmation toast ────────────────────────────────────────────
  if (status === 'subscribed') {
    return (
      <div
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-max z-50 animate-fade-in"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="rounded-2xl px-4 py-2.5 flex items-center gap-2 text-sm font-semibold text-white shadow-lg"
          style={{ backgroundColor: '#C97B8A' }}
        >
          <span>🔔</span>
          <span>Recordatorios activados</span>
        </div>
      </div>
    )
  }

  return null
}
