'use client'

import { useEffect, useState } from 'react'

interface DebugInfo {
  ua: string
  standalone: boolean
  swSupported: boolean
  pushSupported: boolean
  notifPermission: string
  swState: string
  subscription: string | null
  supabaseSubs: number | null
}

export default function DebugPage() {
  const [info, setInfo] = useState<DebugInfo | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resubResult, setResubResult] = useState<string | null>(null)

  useEffect(() => {
    async function gather() {
      const ua = navigator.userAgent
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true

      const swSupported = 'serviceWorker' in navigator
      const pushSupported = 'PushManager' in window
      const notifPermission = 'Notification' in window ? Notification.permission : 'no-api'

      let swState = 'no-sw'
      let subscription: string | null = null

      if (swSupported) {
        try {
          const reg = await navigator.serviceWorker.getRegistration('/')
          swState = reg ? `activo (${reg.active?.state ?? 'sin worker'})` : 'no registrado'

          if (reg && pushSupported) {
            const sub = await reg.pushManager.getSubscription()
            subscription = sub ? sub.endpoint.slice(0, 60) + '…' : 'ninguna'
          }
        } catch (e) {
          swState = `error: ${e}`
        }
      }

      // Count Supabase subscriptions
      let supabaseSubs: number | null = null
      try {
        const res = await fetch('/api/sub-count')
        if (res.ok) {
          const data = await res.json()
          supabaseSubs = data.count
        }
      } catch { /* ignore */ }

      setInfo({ ua, standalone, swSupported, pushSupported, notifPermission, swState, subscription, supabaseSubs })
    }
    gather()
  }, [])

  const sendTest = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/test-push', { method: 'POST' })
      const data = await res.json()
      setTestResult(JSON.stringify(data, null, 2))
    } catch (e) {
      setTestResult(`Error: ${e}`)
    } finally {
      setLoading(false)
    }
  }

  const resuscribe = async () => {
    setResubResult('Registrando SW…')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready

      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setResubResult(`❌ Permiso denegado: ${perm}`)
        return
      }

      let sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const pad = '='.repeat((4 - (vapidKey.length % 4)) % 4)
      const b64 = (vapidKey + pad).replace(/-/g, '+').replace(/_/g, '/')
      const raw = atob(b64)
      const key = Uint8Array.from(Array.from(raw).map((c: string) => c.charCodeAt(0)))

      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer as ArrayBuffer,
      })

      const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
      })
      const data = await res.json()
      setResubResult(`✅ Suscripto: ${JSON.stringify(data)}`)
    } catch (e) {
      setResubResult(`❌ Error: ${e}`)
    }
  }

  const row = (label: string, value: unknown, good?: boolean) => {
    const color =
      good === true ? '#4ade80' : good === false ? '#f87171' : '#e2e8f0'
    return (
      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid #2d3748' }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>{label}</span>
        <span style={{ color, fontSize: 13, fontFamily: 'monospace', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>
          {String(value)}
        </span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#C97B8A' }}>🔍 Debug — Push Notifications</h1>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>pope-nails.vercel.app</p>

      {!info ? (
        <p style={{ color: '#64748b' }}>Cargando diagnóstico…</p>
      ) : (
        <div style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          {row('User Agent', info.ua.slice(0, 80))}
          {row('Modo standalone (PWA)', info.standalone ? 'SÍ ✅' : 'NO ❌ — abrí desde el ícono', info.standalone)}
          {row('ServiceWorker API', info.swSupported ? 'soportado ✅' : 'no soportado ❌', info.swSupported)}
          {row('PushManager API', info.pushSupported ? 'soportado ✅' : 'no soportado ❌', info.pushSupported)}
          {row('Permiso notif.', info.notifPermission, info.notifPermission === 'granted')}
          {row('Estado SW', info.swState)}
          {row('Suscripción local', info.subscription ?? 'ninguna', !!info.subscription && info.subscription !== 'ninguna')}
          {row('Suscripciones en Supabase', info.supabaseSubs !== null ? `${info.supabaseSubs} dispositivos` : 'error al consultar', (info.supabaseSubs ?? 0) > 0)}
        </div>
      )}

      {/* Re-subscribe button */}
      <button
        onClick={resuscribe}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
          backgroundColor: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', marginBottom: 8,
        }}
      >
        🔄 Re-suscribir este dispositivo
      </button>
      {resubResult && (
        <pre style={{ fontSize: 11, color: '#94a3b8', backgroundColor: '#1e293b', padding: 12, borderRadius: 8, overflowX: 'auto', marginBottom: 12 }}>
          {resubResult}
        </pre>
      )}

      {/* Send test notification */}
      <button
        onClick={sendTest}
        disabled={loading}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
          backgroundColor: loading ? '#374151' : '#C97B8A', color: 'white', fontWeight: 700, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 8,
        }}
      >
        {loading ? 'Enviando…' : '🔔 Enviar notificación de prueba'}
      </button>

      {testResult && (
        <pre style={{ fontSize: 11, color: '#94a3b8', backgroundColor: '#1e293b', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
          {testResult}
        </pre>
      )}

      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 12, width: '100%', padding: '10px 0', borderRadius: 10, border: '1px solid #334155',
          backgroundColor: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer',
        }}
      >
        ↩ Actualizar diagnóstico
      </button>
    </div>
  )
}
