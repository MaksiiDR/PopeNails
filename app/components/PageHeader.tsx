import Link from 'next/link'

type Props = {
  kicker: string
  title: string
}

// Encabezado de las páginas internas: banda nocturna con botón para volver
export default function PageHeader({ kicker, title }: Props) {
  return (
    <header className="pn-night sticky top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="pn-stars">
        <div className="max-w-[430px] mx-auto px-5 pt-5 pb-5 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-full border border-white/15 text-[#f3ece0] transition-colors hover:bg-white/10 active:scale-95"
            aria-label="Volver a la agenda"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="min-w-0">
            <p className="pn-label text-pn-goldsoft">{kicker}</p>
            <h1 className="font-display text-[30px] leading-none font-medium mt-1 truncate">{title}</h1>
          </div>
        </div>
      </div>
    </header>
  )
}
