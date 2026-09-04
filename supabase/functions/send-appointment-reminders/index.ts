// Supabase Edge Function: send-appointment-reminders
// Triggered by pg_cron every hour.
// Finds appointments happening in the next 24 hours,
// sends Web Push notifications to all subscribed devices,
// and marks appointments as notificacion_enviada = true.
//
// Uses npm:web-push for proper RFC 8291 payload encryption
// (required by Apple Push Service / iOS)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Appointment {
  id: string
  client_name: string
  service: 'gel' | 'semi' | 'retiro' | 'retiro_otras'
  price: number
  date: string   // YYYY-MM-DD
  time: string   // HH:MM:SS
  notificacion_enviada: boolean
}

interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime12h(time: string): string {
  const [hourStr, minuteStr] = time.split(':')
  let hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) hour = 12
  else if (hour > 12) hour -= 12
  return `${hour}:${minuteStr} ${ampm}`
}

function formatDateEs(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z')
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Santiago',
  })
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@popenails.com'

  // Configure web-push VAPID details (required once before sending)
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const supabase = createClient(supabaseUrl, supabaseKey)

  // ── Find appointments dentro de las próximas 24 horas ──────────────────────
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const nowDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
  const in24hDate = in24h.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
  const nowTime = now.toLocaleTimeString('en-GB', { timeZone: 'America/Santiago' })
  const in24hTime = in24h.toLocaleTimeString('en-GB', { timeZone: 'America/Santiago' })

  const { data: allAppointments, error: apptErr } = await supabase
    .from('appointments')
    .select('*')
    .eq('notificacion_enviada', false)
    .filter('date', 'gte', nowDate)
    .filter('date', 'lte', in24hDate)

  if (apptErr) {
    console.error('Error fetching appointments:', apptErr)
    return new Response(JSON.stringify({ error: apptErr.message }), { status: 500 })
  }

  // Filtrar por hora exacta en los bordes del día
  const appointments = (allAppointments ?? []).filter((apt) => {
    if (apt.date === nowDate && apt.date === in24hDate) {
      return apt.time >= nowTime && apt.time <= in24hTime
    } else if (apt.date === nowDate) {
      return apt.time >= nowTime
    } else if (apt.date === in24hDate) {
      return apt.time <= in24hTime
    }
    return true
  })

  // ── Fetch all push subscriptions ───────────────────────────────────────────
  const { data: subscriptions, error: subErr } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (subErr) {
    console.error('Error fetching subscriptions:', subErr)
    return new Response(JSON.stringify({ error: subErr.message }), { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ ok: true, results: [], message: 'No hay suscripciones push activas.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const results = []

  for (const appointment of appointments as Appointment[]) {
    const serviceLabels: Record<Appointment['service'], string> = {
      gel: 'Soft Gel',
      semi: 'Semi Permanente',
      retiro: 'Retiro de uñas',
      retiro_otras: 'Retiro (Otras)',
    }
    const serviceLabel = serviceLabels[appointment.service] ?? appointment.service
    const timeStr = formatTime12h(appointment.time)
    const dateStr = formatDateEs(appointment.date)

    const notificationPayload = JSON.stringify({
      title: 'Recordatorio de cita 💅',
      body: `${appointment.client_name} tiene una cita de ${serviceLabel} mañana (${dateStr}) a las ${timeStr}.`,
      icon: '/icon-192.jpg',
      badge: '/icon-192.jpg',
      url: '/',
    })

    let sent = 0
    const staleEndpoints: string[] = []

    for (const sub of subscriptions as PushSubscriptionRow[]) {
      try {
        // web-push handles RFC 8291 encryption (aes128gcm) + VAPID headers
        // This is what Apple Push Service requires — raw JSON bodies are rejected by iOS
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          notificationPayload,
          {
            TTL: 86400,      // 24 h — how long APNs/FCM holds the message if device is offline
            urgency: 'normal',
          }
        )
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          // Endpoint expired — queue for cleanup
          staleEndpoints.push(sub.endpoint)
          console.log(`Stale endpoint removed: ${sub.endpoint}`)
        } else {
          console.warn(`Push failed for ${sub.endpoint}:`, err)
        }
      }
    }

    // Remove stale endpoints
    if (staleEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints)
    }

    // Only mark as notified if at least one device received the push
    if (sent > 0) {
      await supabase
        .from('appointments')
        .update({ notificacion_enviada: true })
        .eq('id', appointment.id)
    }

    results.push({ appointment_id: appointment.id, client: appointment.client_name, sent })
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
