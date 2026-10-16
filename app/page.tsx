'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase, Appointment } from '@/lib/supabase'
import AppointmentCard from './components/AppointmentCard'
import AddAppointmentModal from './components/AddAppointmentModal'
import SkeletonCard from './components/SkeletonCard'

// Helper to get YYYY-MM-DD in local time
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Group appointments by date
function groupByDate(appointments: Appointment[]): Record<string, Appointment[]> {
  return appointments.reduce((acc, apt) => {
    if (!acc[apt.date]) acc[apt.date] = []
    acc[apt.date].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>)
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00') // avoid timezone issues
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const todayStr = getLocalDateString(today)
  const tomorrowStr = getLocalDateString(tomorrow)

  if (dateStr === todayStr) return 'Hoy'
  if (dateStr === tomorrowStr) return 'Mañana'

  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function HomePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showPast, setShowPast] = useState(false)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: dbError } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (dbError) {
      setError('No se pudieron cargar las citas. Por favor intenta de nuevo.')
      console.error(dbError)
    } else {
      setAppointments(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleDelete = async (id: string) => {
    // Optimistic UI update
    setAppointments(prev => prev.filter(a => a.id !== id))
    const { error: dbError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
    if (dbError) {
      console.error(dbError)
      // Revert on failure
      fetchAppointments()
    }
  }

  const handleSaved = () => {
    setShowModal(false)
    fetchAppointments()
  }

  const grouped = groupByDate(appointments)
  const sortedDates = Object.keys(grouped).sort()
  
  const todayStr = getLocalDateString()
  const upcomingDates = sortedDates.filter(d => d >= todayStr)
  // Most recent past dates first
  const pastDates = sortedDates.filter(d => d < todayStr).reverse()

  const upcomingAppointmentsCount = appointments.filter(apt => apt.date >= todayStr).length
  const todayLabel = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-pn-ivory">
      {/* Encabezado nocturno con el logo */}
      <header className="pn-night" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="pn-stars">
          <div className="max-w-[430px] mx-auto px-5 pt-5 pb-5">
            <div className="flex items-center justify-between">
              <Image
                src="/plantilla-logo.png"
                alt="Pope Nails"
                width={64}
                height={60}
                className="object-contain shrink-0 h-[56px] w-auto"
                priority
              />
              <nav className="flex items-center gap-2" aria-label="Secciones">
                <Link
                  href="/compras"
                  className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-[13px] font-bold text-[#f3ece0] transition-colors hover:bg-white/10 active:scale-95"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 7h12l-1 13H7L6 7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <path d="M9 7a3 3 0 016 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Compras
                </Link>
                <Link
                  href="/plantilla"
                  className="flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-[13px] font-bold text-[#f3ece0] transition-colors hover:bg-white/10 active:scale-95"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="9.5" cy="9.5" r="1.6" fill="currentColor" />
                    <path d="M5 17l4.5-4.5L13 16l2.5-2.5L19 17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                  Posts
                </Link>
              </nav>
            </div>

            <div className="flex items-center justify-between gap-4 mt-4">
              <h1 className="pn-label text-pn-goldsoft">{todayLabel}</h1>
              <p className="shrink-0 text-[13px] text-white/70">
                <strong className="font-display text-[22px] font-semibold text-[#f3ece0] [font-variant-numeric:lining-nums] mr-1">
                  {loading ? '—' : upcomingAppointmentsCount}
                </strong>
                {upcomingAppointmentsCount === 1 ? 'cita próxima' : 'citas próximas'}
              </p>
            </div>

          </div>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-4 pt-6 pb-32">
        {/* Cargando */}
        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-pn-line bg-pn-paper p-5 text-center">
            <p className="font-semibold text-sm">{error}</p>
            <button onClick={fetchAppointments} className="mt-3 text-sm font-bold text-pn-gold underline underline-offset-4">
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Sin citas */}
        {!loading && !error && appointments.length === 0 && (
          <div className="text-center pt-10 px-6">
            <p className="font-display text-[28px] leading-tight font-medium">Sin citas por ahora</p>
            <p className="text-sm text-pn-muted mt-2">
              Toca <strong className="text-pn-text">Nueva cita</strong> para agendar a tu primera clienta.
            </p>
          </div>
        )}

        {/* Hay citas pasadas pero ninguna próxima */}
        {!loading && !error && appointments.length > 0 && upcomingDates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-pn-line px-5 py-6 text-center">
            <p className="font-display text-[22px] font-medium">No hay citas próximas</p>
            <p className="text-sm text-pn-muted mt-1">Las citas que agendes aparecerán aquí.</p>
          </div>
        )}

        {/* Próximas citas */}
        {!loading && !error && upcomingDates.length > 0 && (
          <div className="space-y-7">
            {upcomingDates.map(date => (
              <section key={date}>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <h2 className="pn-label text-pn-gold">{formatDateHeader(date)}</h2>
                  <span className="flex-1 h-px bg-pn-line" aria-hidden="true" />
                  <span className="text-[11px] font-bold text-pn-muted">
                    {grouped[date].length} {grouped[date].length === 1 ? 'cita' : 'citas'}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {grouped[date].map(apt => (
                    <AppointmentCard key={apt.id} appointment={apt} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Citas pasadas */}
        {!loading && !error && pastDates.length > 0 && (
          <div className="mt-10">
            <button
              onClick={() => setShowPast(!showPast)}
              className="w-full flex items-center justify-between rounded-2xl border border-pn-line bg-pn-paper px-4 py-3.5 text-left transition-colors active:bg-pn-ivory"
              aria-expanded={showPast}
            >
              <span>
                <span className="font-display text-[20px] font-semibold leading-none">Citas pasadas</span>
                <span className="block text-xs text-pn-muted mt-1">
                  {pastDates.reduce((n, d) => n + grouped[d].length, 0)} citas
                </span>
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className={`text-pn-muted transition-transform ${showPast ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className={`grid-accordion ${showPast ? 'open' : ''}`}>
              <div className="grid-accordion-inner">
                <div className="space-y-6 pt-5">
                  {pastDates.map(date => (
                    <section key={date}>
                      <div className="flex items-center gap-3 mb-3 px-1">
                        <h2 className="pn-label text-pn-muted">{formatDateHeader(date)}</h2>
                        <span className="flex-1 h-px bg-pn-line" aria-hidden="true" />
                      </div>
                      <div className="space-y-2.5">
                        {grouped[date].map(apt => (
                          <AppointmentCard key={apt.id} appointment={apt} onDelete={handleDelete} past />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Botón principal: nueva cita */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 pointer-events-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
      >
        <div className="max-w-[430px] mx-auto px-4 flex justify-end">
          <button
            id="btn-add-appointment"
            onClick={() => setShowModal(true)}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-pn-ink text-[#f3ece0] pl-4 pr-5 py-3.5 font-bold text-[15px] shadow-[0_10px_30px_rgba(16,14,19,0.35)] transition-transform active:scale-95"
            aria-label="Agregar cita"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Nueva cita
          </button>
        </div>
      </div>

      {showModal && <AddAppointmentModal onClose={() => setShowModal(false)} onSaved={handleSaved} />}
    </div>
  )
}
