'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SERVICES, SERVICE_ORDER, ServiceKey, formatPrice } from '@/lib/services'

type NewAppointment = {
  client_name: string
  service: ServiceKey | null
  price: number
  date: string
  time: string
}

type Props = {
  onClose: () => void
  onSaved: () => void
}

export default function AddAppointmentModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState<NewAppointment>({
    client_name: '',
    service: null,
    price: 0,
    date: '',
    time: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectService = (service: ServiceKey) => {
    setForm(prev => ({ ...prev, service, price: SERVICES[service].price }))
  }

  const handleSave = async () => {
    if (!form.client_name.trim()) {
      setError('Escribe el nombre de la clienta.')
      return
    }
    if (!form.service) {
      setError('Elige un servicio.')
      return
    }
    if (!form.date) {
      setError('Elige la fecha de la cita.')
      return
    }
    if (!form.time) {
      setError('Elige la hora de la cita.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: dbError } = await supabase.from('appointments').insert([
      {
        client_name: form.client_name.trim(),
        service: form.service,
        price: form.price,
        date: form.date,
        time: form.time,
      },
    ])

    setLoading(false)

    if (dbError) {
      setError('No se pudo guardar la cita. Revisa tu conexión e intenta de nuevo.')
      console.error(dbError)
      return
    }

    onSaved()
  }

  const fieldLabel = 'block text-[13px] font-bold mb-1.5'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in bg-pn-ink/55"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-[430px] max-h-[92vh] overflow-y-auto bg-pn-ivory rounded-t-[28px] px-5 pt-3 animate-slide-up"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-appointment-title"
      >
        <div className="w-10 h-1 rounded-full bg-pn-line mx-auto mb-4" />

        <p className="pn-label text-pn-gold text-center">Agenda</p>
        <h2 id="new-appointment-title" className="font-display text-[32px] leading-none font-medium text-center mt-1 mb-6">
          Nueva cita
        </h2>

        <div className="space-y-5">
          <div>
            <label htmlFor="client-name-input" className={fieldLabel}>
              Nombre de la clienta
            </label>
            <input
              id="client-name-input"
              type="text"
              placeholder="Ej: María González"
              value={form.client_name}
              onChange={e => setForm(prev => ({ ...prev, client_name: e.target.value }))}
              className="pn-input"
              autoComplete="off"
            />
          </div>

          <div>
            <span className={fieldLabel}>Servicio</span>
            <div className="grid grid-cols-2 gap-2.5">
              {SERVICE_ORDER.map(key => {
                const svc = SERVICES[key]
                const active = form.service === key
                return (
                  <button
                    key={key}
                    id={`btn-service-${key.replace('_', '-')}`}
                    type="button"
                    onClick={() => selectService(key)}
                    aria-pressed={active}
                    className="service-btn rounded-2xl border-[1.5px] p-3.5 text-left"
                    style={{
                      borderColor: active ? svc.color : 'var(--pn-line)',
                      backgroundColor: active ? svc.tint : '#fff',
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: svc.color }} aria-hidden="true" />
                      <span className="font-bold text-[14px] leading-tight">{svc.label}</span>
                    </span>
                    <span className="block text-xs font-semibold mt-1.5 tabular-nums" style={{ color: active ? svc.color : 'var(--pn-muted)' }}>
                      {formatPrice(svc.price)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="price-input" className={fieldLabel}>
              Precio total <span className="font-semibold text-pn-muted">· puedes cambiarlo según el diseño</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-pn-muted">$</span>
              <input
                id="price-input"
                type="number"
                inputMode="numeric"
                placeholder="15000"
                value={form.price || ''}
                onChange={e => setForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                className="pn-input tabular-nums"
                style={{ paddingLeft: 28 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="min-w-0">
              <label htmlFor="date-input" className={fieldLabel}>
                Fecha
              </label>
              <input
                id="date-input"
                type="date"
                value={form.date}
                onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="pn-input"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="time-input" className={fieldLabel}>
                Hora
              </label>
              <input
                id="time-input"
                type="time"
                value={form.time}
                onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}
                className="pn-input"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-[#f6e3e3] text-[#8a2f2f] px-4 py-3 text-sm font-semibold text-center" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              id="btn-cancel"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-full py-3.5 font-bold text-[15px] border-[1.5px] border-pn-line bg-white transition-opacity hover:opacity-80"
            >
              Cancelar
            </button>
            <button
              id="btn-save"
              onClick={handleSave}
              disabled={loading}
              className="flex-[1.4] rounded-full py-3.5 font-bold text-[15px] bg-pn-ink text-[#f3ece0] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Guardando…' : 'Guardar cita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
