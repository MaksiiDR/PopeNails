import Link from 'next/link'
import ShoppingList from '../components/ShoppingList'

export default function ComprasPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <header
        className="w-full sticky top-0 z-40 bg-white"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="max-w-[430px] mx-auto px-5 pt-8 pb-4 flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-gray-100"
            style={{ color: '#1A1A1A' }}
            aria-label="Volver atrás"
          >
            <span className="text-xl font-bold">←</span>
          </Link>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{ fontFamily: 'var(--font-playfair)', color: '#1A1A1A' }}
          >
            Compras
          </h1>
        </div>
      </header>

      <main className="max-w-[430px] mx-auto px-4 py-8 pb-28">
        <ShoppingList />
      </main>
    </div>
  )
}
