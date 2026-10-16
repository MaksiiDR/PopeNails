import { Cormorant_Garamond, Cinzel, Nunito } from 'next/font/google'

// Display: títulos con la misma serif del logo y los posts
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

// Etiquetas en versalitas (fechas, secciones)
export const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-label',
  display: 'swap',
})

// Texto de interfaz
export const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
})
