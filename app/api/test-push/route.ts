import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  if (!process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ ok: false, error: 'Falta VAPID_PRIVATE_KEY' }, { status: 500 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:admin@popenails.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*')

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: false, message: 'No hay suscripciones registradas en Supabase.' })
  }

  const payload = JSON.stringify({
    title: '🔔 Prueba Pope Nails',
    body: 'Las notificaciones funcionan correctamente 💅',
    icon: '/icon-192.jpg',
    badge: '/icon-192.jpg',
    url: '/',
  })

  const results = []
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60, urgency: 'high' }
      )
      results.push({ ok: true, endpoint: sub.endpoint.slice(0, 50) })
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string }
      results.push({ ok: false, status: e.statusCode, endpoint: sub.endpoint.slice(0, 50), error: e.message })
    }
  }

  return NextResponse.json({ ok: true, total: subs.length, sent: results.filter(r => r.ok).length, results })
}
