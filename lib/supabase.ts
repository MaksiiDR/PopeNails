import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Appointment = {
  id: string
  created_at: string
  client_name: string
  service: 'gel' | 'semi' | 'retiro' | 'retiro_otras'
  price: number
  date: string
  time: string
}
