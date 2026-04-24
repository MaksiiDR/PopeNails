'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type NewAppointment = {
  client_name: string
  service: 'gel' | 'semi' | null
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

  const selectService = (service: 'gel' | 'semi') => {
    setForm(prev => ({
      ...prev,
      service,
      price: service === 'gel' ? 10000 : 5000,
    }))
  }

  const handleSave = async () => {
    if (!form.client_name.trim()) {
      setError('Por favor ingresa el nombre de la clienta.')
      return
    }
    if (!form.service) {
      setError('Por favor selecciona un servicio.')
      return
    }
    if (!form.date) {
      setError('Por favor selecciona una fecha.')
      return
    }
    if (!form.time) {
      setError('Por favor selecciona una hora.')
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
      setError('Error al guardar la cita. Por favor intenta de nuevo.')
      console.error(dbError)
      return
    }

    onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in"
      style={{ backgroundColor: 'rgba(74, 37, 53, 0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[430px] bg-white rounded-t-3xl p-6 pb-10 animate-slide-up"
        style={{ boxShadow: '0 -8px 40px rgba(201, 123, 138, 0.25)' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

        <h2
          className="text-2xl font-bold mb-5 text-center"
          style={{ fontFamily: 'var(--font-playfair)', color: '#4A2535' }}
        >
          Nueva Cita
        </h2>

        {/* Client name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4A2535' }}>
            Nombre de la clienta
          </label>
          <input
            id="client-name-input"
            type="text"
            placeholder="Ej: María González"
            value={form.client_name}
            onChange={e => setForm(prev => ({ ...prev, client_name: e.target.value }))}
            className="pn-input w-full rounded-xl border-2 px-4 py-3 text-base transition-all"
            style={{
              borderColor: '#F0D8D4',
              backgroundColor: '#FFF7F5',
              color: '#4A2535',
            }}
          />
        </div>

        {/* Service selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#4A2535' }}>
            Servicio
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              id="btn-service-gel"
              onClick={() => selectService('gel')}
              className="service-btn rounded-2xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: form.service === 'gel' ? '#C97B8A' : '#F0D8D4',
                backgroundColor: form.service === 'gel' ? '#FDE8E4' : '#FFF7F5',
              }}
            >
              <div className="text-2xl mb-1">💅</div>
              <div className="font-bold text-sm" style={{ color: '#4A2535' }}>Soft Gel</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#C97B8A' }}>$10.000</div>
            </button>
            <button
              id="btn-service-semi"
              onClick={() => selectService('semi')}
              className="service-btn rounded-2xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: form.service === 'semi' ? '#7B9EC9' : '#F0D8D4',
                backgroundColor: form.service === 'semi' ? '#E8F0FB' : '#FFF7F5',
              }}
            >
              <div className="text-2xl mb-1">✨</div>
              <div className="font-bold text-sm" style={{ color: '#4A2535' }}>Semi Permanente</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#7B9EC9' }}>$5.000</div>
            </button>
          </div>
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4A2535' }}>
            Fecha
          </label>
          <input
            id="date-input"
            type="date"
            value={form.date}
            onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
            className="pn-input w-full rounded-xl border-2 px-4 py-3 text-base transition-all"
            style={{
              borderColor: '#F0D8D4',
              backgroundColor: '#FFF7F5',
              color: '#4A2535',
            }}
          />
        </div>

        {/* Time */}
        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#4A2535' }}>
            Hora
          </label>
          <input
            id="time-input"
            type="time"
            value={form.time}
            onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}
            className="pn-input w-full rounded-xl border-2 px-4 py-3 text-base transition-all"
            style={{
              borderColor: '#F0D8D4',
              backgroundColor: '#FFF7F5',
              color: '#4A2535',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm text-center font-medium"
            style={{ backgroundColor: '#FDEAE8', color: '#C97B8A' }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            id="btn-cancel"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-2xl py-3.5 font-bold text-base transition-all hover:opacity-80"
            style={{ backgroundColor: '#F0D8D4', color: '#4A2535' }}
          >
            Cancelar
          </button>
          <button
            id="btn-save"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-2xl py-3.5 font-bold text-base text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#C97B8A' }}
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
