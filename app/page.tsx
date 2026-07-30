'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { supabase, Appointment } from '@/lib/supabase'
import AppointmentCard from './components/AppointmentCard'
import AddAppointmentModal from './components/AddAppointmentModal'
import StatsModal from './components/StatsModal'
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
  const [showStats, setShowStats] = useState(false)
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <header
        className="w-full sticky top-0 z-40 bg-white"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="max-w-[430px] mx-auto px-5 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="Pope Nails Logo"
                width={60}
                height={60}
                className="object-contain shrink-0"
                priority
              />
            </div>
            {/* Appointment counter & Stats button */}
            <div className="flex items-center gap-2">
              <div
                className="px-4 py-2 rounded-2xl text-center"
                style={{ backgroundColor: '#F5F5F5' }}
              >
                <span className="block text-2xl font-bold" style={{ color: '#1A1A1A' }}>
                  {loading ? '—' : upcomingAppointmentsCount}
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#666666' }}>
                  {upcomingAppointmentsCount === 1 ? 'Cita' : 'Citas'}
                </span>
              </div>
              <button
                id="btn-open-stats"
                onClick={() => setShowStats(true)}
                className="p-3 rounded-2xl flex flex-col items-center justify-center transition-all hover:bg-gray-200 active:scale-95"
                style={{ backgroundColor: '#F5F5F5', color: '#1A1A1A' }}
                aria-label="Ver estadísticas"
                title="Estadísticas"
              >
                <span className="text-xl leading-none">📊</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide mt-1" style={{ color: '#666666' }}>
                  Stats
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[430px] mx-auto px-4 py-5 pb-28">
        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div
            className="rounded-2xl p-5 text-center"
            style={{ backgroundColor: '#F5F5F5', color: '#1A1A1A' }}
          >
            <p className="text-2xl mb-2">😔</p>
            <p className="font-semibold text-sm">{error}</p>
            <button
              onClick={fetchAppointments}
              className="mt-3 text-sm font-bold underline"
              style={{ color: '#1A1A1A' }}
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && appointments.length === 0 && (
          <div className="text-center pt-12">
            <div className="text-6xl mb-4">💅</div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: 'var(--font-playfair)', color: '#1A1A1A' }}
            >
              Sin citas por ahora
            </h2>
            <p className="text-sm" style={{ color: '#666666' }}>
              Toca el botón <strong>+</strong> para agregar tu primera cita.
            </p>
          </div>
        )}

        {/* No upcoming appointments but past exist */}
        {!loading && !error && appointments.length > 0 && upcomingDates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm font-medium" style={{ color: '#666666' }}>
              No hay citas próximas programadas.
            </p>
          </div>
        )}

        {/* Upcoming Appointments */}
        {!loading && !error && upcomingDates.length > 0 && (
          <div className="space-y-6">
            {upcomingDates.map(date => (
              <section key={date}>
                {/* Date header */}
                <h2
                  className="capitalize font-bold text-sm mb-2.5 px-1"
                  style={{ color: '#666666' }}
                >
                  {formatDateHeader(date)}
                </h2>
                <div className="space-y-2.5">
                  {grouped[date].map(apt => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Past Appointments */}
        {!loading && !error && pastDates.length > 0 && (
          <div className="mt-10 mb-6">
            <button 
              onClick={() => setShowPast(!showPast)}
              className="w-full flex items-center gap-3 mb-2 px-1 transition-opacity hover:opacity-70 text-left"
            >
              <h2
                className="text-lg font-bold flex items-center gap-2"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1A1A1A' }}
              >
                Citas Pasadas
                <span className="text-xs text-gray-400 mt-1">{showPast ? '▲' : '▼'}</span>
              </h2>
              <div className="flex-1 h-px bg-gray-200"></div>
            </button>
            
            <div className={`grid-accordion ${showPast ? 'open' : ''}`}>
              <div className="grid-accordion-inner">
                <div className="space-y-6 opacity-75 pt-3">
                  {pastDates.map(date => (
                    <section key={date}>
                      {/* Date header */}
                      <h2
                        className="capitalize font-bold text-sm mb-2.5 px-1"
                        style={{ color: '#666666' }}
                      >
                        {formatDateHeader(date)}
                      </h2>
                      <div className="space-y-2.5">
                        {grouped[date].map(apt => (
                          <AppointmentCard
                            key={apt.id}
                            appointment={apt}
                            onDelete={handleDelete}
                          />
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

      {/* Floating Action Buttons */}
      <a
        href="/compras"
        className="fab-btn fixed bottom-7 left-1/2 -translate-x-[calc(215px-28px)] flex items-center justify-center w-14 h-14 rounded-full text-white text-2xl font-light shadow-lg transition-transform hover:scale-110 active:scale-95 z-40"
        style={{ backgroundColor: '#1A1A1A' }}
        aria-label="Ver compras"
      >
        🛍️
      </a>
      
      <button
        id="btn-add-appointment"
        onClick={() => setShowModal(true)}
        className="fab-btn fixed bottom-7 right-1/2 translate-x-[calc(215px-28px)] flex items-center justify-center w-14 h-14 rounded-full text-white text-3xl font-light shadow-lg transition-transform hover:scale-110 active:scale-95 z-40"
        style={{ backgroundColor: '#1A1A1A' }}
        aria-label="Agregar cita"
      >
        +
      </button>

      {/* Add Appointment Modal */}
      {showModal && (
        <AddAppointmentModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Stats Modal */}
      {showStats && (
        <StatsModal
          appointments={appointments}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  )
}
