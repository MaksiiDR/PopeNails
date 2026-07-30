'use client'

import { useMemo } from 'react'
import { Appointment } from '@/lib/supabase'

type Props = {
  appointments: Appointment[]
  onClose: () => void
}

export default function StatsModal({ appointments, onClose }: Props) {
  const stats = useMemo(() => {
    const totalAppointments = appointments.length
    const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.price || 0), 0)

    // Current month filter
    const now = new Date()
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    const monthAppointments = appointments.filter(apt => apt.date && apt.date.startsWith(currentMonthStr))
    const monthRevenue = monthAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0)

    // Distribution by service
    const serviceCounts: Record<string, { count: number; revenue: number; label: string; icon: string }> = {
      gel: { count: 0, revenue: 0, label: 'Soft Gel', icon: '💅' },
      semi: { count: 0, revenue: 0, label: 'Semi Permanente', icon: '✨' },
      retiro: { count: 0, revenue: 0, label: 'Retiro de Uñas', icon: '🧼' },
      retiro_otras: { count: 0, revenue: 0, label: 'Retiro (Otras)', icon: '🧴' },
    }

    appointments.forEach(apt => {
      if (serviceCounts[apt.service]) {
        serviceCounts[apt.service].count += 1
        serviceCounts[apt.service].revenue += apt.price || 0
      }
    })

    // Top Client (most frequent)
    const clientCounts: Record<string, { count: number; totalSpent: number }> = {}
    appointments.forEach(apt => {
      const name = apt.client_name.trim()
      if (!clientCounts[name]) {
        clientCounts[name] = { count: 0, totalSpent: 0 }
      }
      clientCounts[name].count += 1
      clientCounts[name].totalSpent += apt.price || 0
    })

    const topClients = Object.entries(clientCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count || b.totalSpent - a.totalSpent)
      .slice(0, 3)

    const avgTicket = totalAppointments > 0 ? Math.round(totalRevenue / totalAppointments) : 0

    return {
      totalAppointments,
      totalRevenue,
      monthAppointmentsCount: monthAppointments.length,
      monthRevenue,
      avgTicket,
      serviceCounts,
      topClients,
    }
  }, [appointments])

  const formatCLP = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(26, 26, 26, 0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[430px] bg-white rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto animate-slide-up"
        style={{ boxShadow: '0 -8px 40px rgba(26, 26, 26, 0.15)' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-playfair)', color: '#1A1A1A' }}
          >
            Estadísticas 📊
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Resumen General */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-4 rounded-2xl" style={{ backgroundColor: '#F8F9FA', border: '1px solid #E9ECEF' }}>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ingresos Este Mes</span>
            <span className="block text-xl font-bold text-emerald-700">{formatCLP(stats.monthRevenue)}</span>
            <span className="block text-[11px] text-gray-400 mt-0.5">{stats.monthAppointmentsCount} citas este mes</span>
          </div>
          <div className="p-4 rounded-2xl" style={{ backgroundColor: '#F8F9FA', border: '1px solid #E9ECEF' }}>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ingresos Históricos</span>
            <span className="block text-xl font-bold" style={{ color: '#1A1A1A' }}>{formatCLP(stats.totalRevenue)}</span>
            <span className="block text-[11px] text-gray-400 mt-0.5">{stats.totalAppointments} citas registradas</span>
          </div>
        </div>

        {/* Promedio por cita */}
        <div className="p-4 rounded-2xl mb-5 flex items-center justify-between" style={{ backgroundColor: '#FAF6F0', border: '1px solid #F0E6D8' }}>
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8C6D46' }}>Ticket Promedio</span>
            <span className="text-xs text-gray-500">Ingreso estimado por cliente</span>
          </div>
          <span className="text-xl font-bold" style={{ color: '#4A3C31' }}>{formatCLP(stats.avgTicket)}</span>
        </div>

        {/* Desglose por Servicio */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Servicios Realizados</h3>
          <div className="space-y-2.5">
            {Object.entries(stats.serviceCounts).map(([key, data]) => {
              const percentage = stats.totalAppointments > 0 ? Math.round((data.count / stats.totalAppointments) * 100) : 0
              return (
                <div key={key} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{data.icon}</span>
                      <span className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{data.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm" style={{ color: '#1A1A1A' }}>{data.count} ({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-neutral-800 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="mt-1.5 text-right text-[11px] font-medium text-gray-500">
                    Recaudado: {formatCLP(data.revenue)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Clientas */}
        {stats.topClients.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Clientas Frecuentes 🔥</h3>
            <div className="space-y-2">
              {stats.topClients.map((client, idx) => (
                <div key={client.name} className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-sm block" style={{ color: '#1A1A1A' }}>{client.name}</span>
                      <span className="text-[11px] text-gray-400">{client.count} {client.count === 1 ? 'cita' : 'citas'}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-neutral-700">{formatCLP(client.totalSpent)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
