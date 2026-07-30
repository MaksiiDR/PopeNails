'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type NewAppointment = {
  client_name: string
  service: 'gel' | 'semi' | 'retiro' | 'retiro_otras' | null
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

  const selectService = (service: 'gel' | 'semi' | 'retiro' | 'retiro_otras') => {
    let basePrice = 0;
    if (service === 'gel') basePrice = 15000;
    else if (service === 'semi') basePrice = 10000;
    else if (service === 'retiro') basePrice = 2000;
    else if (service === 'retiro_otras') basePrice = 3000;

    setForm(prev => ({
      ...prev,
      service,
      price: basePrice,
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
      style={{ backgroundColor: 'rgba(26, 26, 26, 0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[430px] bg-white rounded-t-3xl p-6 pb-10 animate-slide-up"
        style={{ boxShadow: '0 -8px 40px rgba(26, 26, 26, 0.15)' }}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

        <h2
          className="text-2xl font-bold mb-5 text-center"
          style={{ fontFamily: 'var(--font-playfair)', color: '#1A1A1A' }}
        >
          Nueva Cita
        </h2>

        {/* Client name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
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
              borderColor: '#E5E5E5',
              backgroundColor: '#FAFAFA',
              color: '#1A1A1A',
            }}
          />
        </div>

        {/* Service selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1A1A' }}>
            Servicio
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              id="btn-service-gel"
              type="button"
              onClick={() => selectService('gel')}
              className="service-btn rounded-2xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: form.service === 'gel' ? '#4A3C31' : '#E5E5E5',
                backgroundColor: form.service === 'gel' ? '#F5F0E6' : '#FAFAFA',
              }}
            >
              <div className="text-2xl mb-1">💅</div>
              <div className="font-bold text-sm" style={{ color: '#1A1A1A' }}>Soft Gel</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: form.service === 'gel' ? '#4A3C31' : '#666666' }}>$15.000</div>
            </button>
            <button
              id="btn-service-semi"
              type="button"
              onClick={() => selectService('semi')}
              className="service-btn rounded-2xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: form.service === 'semi' ? '#2C332D' : '#E5E5E5',
                backgroundColor: form.service === 'semi' ? '#E8ECEF' : '#FAFAFA',
              }}
            >
              <div className="text-2xl mb-1">✨</div>
              <div className="font-bold text-sm" style={{ color: '#1A1A1A' }}>Semi Permanente</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: form.service === 'semi' ? '#2C332D' : '#666666' }}>$10.000</div>
            </button>
            <button
              id="btn-service-retiro"
              type="button"
              onClick={() => selectService('retiro')}
              className="service-btn rounded-2xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: form.service === 'retiro' ? '#666666' : '#E5E5E5',
                backgroundColor: form.service === 'retiro' ? '#F0F0F0' : '#FAFAFA',
              }}
            >
              <div className="text-2xl mb-1">🧼</div>
              <div className="font-bold text-sm" style={{ color: '#1A1A1A' }}>Retiro de uñas</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: form.service === 'retiro' ? '#666666' : '#666666' }}>$2.000</div>
            </button>
            <button
              id="btn-service-retiro-otras"
              type="button"
              onClick={() => selectService('retiro_otras')}
              className="service-btn rounded-2xl border-2 p-4 text-left transition-all"
              style={{
                borderColor: form.service === 'retiro_otras' ? '#1A1A1A' : '#E5E5E5',
                backgroundColor: form.service === 'retiro_otras' ? '#E5E5E5' : '#FAFAFA',
              }}
            >
              <div className="text-2xl mb-1">🧴</div>
              <div className="font-bold text-[13px] leading-tight" style={{ color: '#1A1A1A' }}>Retiro (Otras)</div>
              <div className="text-xs font-semibold mt-1" style={{ color: form.service === 'retiro_otras' ? '#1A1A1A' : '#666666' }}>$3.000</div>
            </button>
          </div>
        </div>

        {/* Total Price (Editable) */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
            Precio Total ($) - <span className="font-normal text-xs" style={{ color: '#666666' }}>Modificable por diseño</span>
          </label>
          <input
            id="price-input"
            type="number"
            placeholder="Ej: 15000"
            value={form.price || ''}
            onChange={e => setForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
            className="pn-input w-full rounded-xl border-2 px-4 py-3 text-base transition-all"
            style={{
              borderColor: '#E5E5E5',
              backgroundColor: '#FAFAFA',
              color: '#1A1A1A',
            }}
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
            Fecha
          </label>
          <input
            id="date-input"
            type="date"
            value={form.date}
            onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
            className="pn-input w-full rounded-xl border-2 px-4 py-3 text-base transition-all"
            style={{
              borderColor: '#E5E5E5',
              backgroundColor: '#FAFAFA',
              color: '#1A1A1A',
            }}
          />
        </div>

        {/* Time */}
        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
            Hora
          </label>
          <input
            id="time-input"
            type="time"
            value={form.time}
            onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}
            className="pn-input w-full rounded-xl border-2 px-4 py-3 text-base transition-all"
            style={{
              borderColor: '#E5E5E5',
              backgroundColor: '#FAFAFA',
              color: '#1A1A1A',
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm text-center font-medium"
            style={{ backgroundColor: '#F5F5F5', color: '#1A1A1A' }}
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
            className="flex-1 rounded-2xl py-3.5 font-bold text-base transition-all hover:opacity-80 border-2"
            style={{ borderColor: '#E5E5E5', backgroundColor: '#FAFAFA', color: '#1A1A1A' }}
          >
            Cancelar
          </button>
          <button
            id="btn-save"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-2xl py-3.5 font-bold text-base text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#1A1A1A' }}
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
