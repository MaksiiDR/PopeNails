'use client'

import { useState } from 'react'
import { Appointment } from '@/lib/supabase'
import { SERVICES, formatPrice, splitTime } from '@/lib/services'

type Props = {
  appointment: Appointment
  onDelete: (id: string) => void
  past?: boolean
}

export default function AppointmentCard({ appointment, onDelete, past = false }: Props) {
  const [confirming, setConfirming] = useState(false)
  const svc = SERVICES[appointment.service] ?? SERVICES.gel
  const { clock, period } = splitTime(appointment.time)

  return (
    <div
      className={`appointment-card relative rounded-2xl border border-pn-line bg-pn-paper overflow-hidden ${
        past ? 'opacity-70' : 'shadow-[0_1px_0_rgba(29,26,32,0.04)]'
      }`}
    >
      {/* Franja de color del servicio */}
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: svc.color }} aria-hidden="true" />

      <div className="flex items-stretch">
        {/* Hora */}
        <div className="w-[76px] shrink-0 flex flex-col items-center justify-center py-3.5 pl-1 border-r border-pn-line">
          <span className="font-display text-[22px] leading-none font-semibold [font-variant-numeric:lining-nums]">{clock}</span>
          <span className="pn-label text-[9px] text-pn-muted mt-1">{period}</span>
        </div>

        {/* Clienta y servicio */}
        <div className="flex-1 min-w-0 px-3.5 py-3">
          <p className="font-bold text-[15px] leading-tight truncate">{appointment.client_name}</p>
          <span
            className="inline-block mt-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: svc.tint, color: svc.color }}
          >
            {svc.label}
          </span>
        </div>

        {/* Precio */}
        <div className="shrink-0 flex flex-col items-end justify-center pr-3 py-3">
          <span className="font-bold text-[15px] tabular-nums">{formatPrice(appointment.price)}</span>
          <button
            id={`delete-${appointment.id}`}
            onClick={() => setConfirming(true)}
            className="mt-1 -mr-1 w-7 h-7 flex items-center justify-center rounded-full text-pn-muted transition-colors hover:bg-pn-ivory active:scale-95"
            aria-label={`Eliminar cita de ${appointment.client_name}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Confirmación antes de borrar */}
      {confirming && (
        <div className="absolute inset-0 flex items-center justify-between gap-2 bg-pn-ink/95 px-4 animate-fade-in">
          <p className="text-sm text-[#f3ece0] font-semibold min-w-0 truncate">¿Eliminar esta cita?</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConfirming(false)}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold text-[#f3ece0] border border-white/25"
            >
              No
            </button>
            <button
              onClick={() => onDelete(appointment.id)}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold bg-[#f3ece0] text-pn-ink"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
