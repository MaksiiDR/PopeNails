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
  const isGel = appointment.service === 'gel'

  return (
    <div
      className="appointment-card relative bg-white rounded-2xl p-4 border"
      style={{ borderColor: '#F0D8D4' }}
    >
      {/* Delete button */}
      <button
        id={`delete-${appointment.id}`}
        onClick={() => onDelete(appointment.id)}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-all hover:bg-red-50"
        style={{ color: '#C97B8A' }}
        aria-label="Eliminar cita"
        title="Eliminar cita"
      >
        ×
      </button>

      <div className="flex items-center gap-3 pr-6">
        {/* Service icon */}
        <div
          className="w-11 h-11 flex items-center justify-center rounded-2xl text-xl flex-shrink-0"
          style={{ backgroundColor: isGel ? '#FDE8E4' : '#E8F0FB' }}
        >
          {isGel ? '💅' : '✨'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-base truncate leading-tight"
            style={{ color: '#4A2535' }}
          >
            {appointment.client_name}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {/* Service badge */}
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: isGel ? '#FDE8E4' : '#E8F0FB',
                color: isGel ? '#C97B8A' : '#5A82B4',
              }}
            >
              {isGel ? 'Soft Gel' : 'Semi Permanente'}
            </span>
          </div>
        </div>

        {/* Price & time */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-base" style={{ color: '#C97B8A' }}>
            {formatPrice(appointment.price)}
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#9B7B85' }}>
            {formatTime(appointment.time)}
          </p>
        </div>
      </div>
    </div>
  )
}
