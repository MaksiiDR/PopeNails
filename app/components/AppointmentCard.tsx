import { Appointment } from '@/lib/supabase'

type Props = {
  appointment: Appointment
  onDelete: (id: string) => void
}

function formatTime(time: string): string {
  // time is in HH:MM or HH:MM:SS format
  const [hourStr, minuteStr] = time.split(':')
  let hour = parseInt(hourStr, 10)
  const minute = minuteStr
  const ampm = hour >= 12 ? 'PM' : 'AM'
  if (hour === 0) hour = 12
  else if (hour > 12) hour -= 12
  return `${hour}:${minute} ${ampm}`
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-CL')}`
}

export default function AppointmentCard({ appointment, onDelete }: Props) {
  let icon = '💅'
  let label = 'Soft Gel'
  let bgColor = '#F5F0E6'
  let textColor = '#4A3C31'

  if (appointment.service === 'semi') {
    icon = '✨'
    label = 'Semi Permanente'
    bgColor = '#E8ECEF'
    textColor = '#2C332D'
  } else if (appointment.service === 'retiro') {
    icon = '🧼'
    label = 'Retiro de uñas'
    bgColor = '#F0F0F0'
    textColor = '#666666'
  } else if (appointment.service === 'retiro_otras') {
    icon = '🧴'
    label = 'Retiro (Otras)'
    bgColor = '#E5E5E5'
    textColor = '#1A1A1A'
  }

  return (
    <div
      className="appointment-card relative bg-white rounded-2xl p-4 border"
      style={{ borderColor: '#E5E5E5' }}
    >
      {/* Delete button */}
      <button
        id={`delete-${appointment.id}`}
        onClick={() => onDelete(appointment.id)}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-all hover:bg-gray-100"
        style={{ color: '#1A1A1A' }}
        aria-label="Eliminar cita"
        title="Eliminar cita"
      >
        ×
      </button>

      <div className="flex items-center gap-3 pr-6">
        {/* Service icon */}
        <div
          className="w-11 h-11 flex items-center justify-center rounded-2xl text-xl flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          {icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-base truncate leading-tight"
            style={{ color: '#1A1A1A' }}
          >
            {appointment.client_name}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {/* Service badge */}
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: bgColor,
                color: textColor,
              }}
            >
              {label}
            </span>
          </div>
        </div>

        {/* Price & time */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-base" style={{ color: '#1A1A1A' }}>
            {formatPrice(appointment.price)}
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#666666' }}>
            {formatTime(appointment.time)}
          </p>
        </div>
      </div>
    </div>
  )
}
