import { supabase } from './supabase'

/** Convert a base64url string to Uint8Array (needed for applicationServerKey) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from(Array.from(raw).map((char) => char.charCodeAt(0)))
}

/** Register the Service Worker */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    console.log('[SW] Registered:', reg.scope)
    return reg
  } catch (err) {
    console.error('[SW] Registration failed:', err)
    return null
  }
}

/** Request notification permission from the user */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}

/**
 * Subscribe the current browser to push notifications and
 * save the subscription to Supabase push_subscriptions table.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
    return null
  }

  const reg = await navigator.serviceWorker.ready
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

  let subscription: PushSubscription | null = null
  try {
    // Reuse existing subscription if present
    subscription = await reg.pushManager.getSubscription()
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      })
    }
  } catch (err) {
    console.error('[Push] Subscription failed:', err)
    return null
  }

  // Persist to Supabase
  const { endpoint, keys } = subscription.toJSON() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('push_subscriptions').upsert(
    { endpoint, p256dh: keys.p256dh, auth: keys.auth, user_id: user?.id },
    { onConflict: 'endpoint' }
  )

  if (error) {
    console.error('[Push] Failed to save subscription:', error)
  } else {
    console.log('[Push] Subscription saved ✓')
  }

  return subscription
}

/** Unsubscribe and remove from Supabase */
export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const subscription = await reg.pushManager.getSubscription()
  if (!subscription) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}
