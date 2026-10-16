import PageHeader from '../components/PageHeader'
import ShoppingList from '../components/ShoppingList'

export default function ComprasPage() {
  return (
    <div className="min-h-screen bg-pn-ivory">
      <PageHeader kicker="Insumos" title="Compras" />
      <main className="max-w-[430px] mx-auto px-4 py-6 pb-28">
        <ShoppingList />
      </main>
    </div>
  )
}
