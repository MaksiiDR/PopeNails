import type { Appointment } from './supabase'

export type ServiceKey = Appointment['service']

// Nombre, precio base y color de cada servicio (un solo lugar para toda la app)
export const SERVICES: Record<ServiceKey, { label: string; price: number; color: string; tint: string }> = {
  gel: { label: 'Soft Gel', price: 15000, color: '#a8844b', tint: '#f4ecdd' },
  semi: { label: 'Semipermanente', price: 10000, color: '#6b3157', tint: '#f3e6ee' },
  retiro: { label: 'Retiro de uñas', price: 2000, color: '#6f7480', tint: '#eceef1' },
  retiro_otras: { label: 'Retiro (otras)', price: 3000, color: '#8a7466', tint: '#f0e9e4' },
}

export const SERVICE_ORDER: ServiceKey[] = ['gel', 'semi', 'retiro', 'retiro_otras']

export function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-CL')}`
}

export function splitTime(time: string): { clock: string; period: string } {
  const [hourStr, minute] = time.split(':')
  let hour = parseInt(hourStr, 10)
  const period = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) hour = 12
  else if (hour > 12) hour -= 12
  return { clock: `${hour}:${minute}`, period }
}
