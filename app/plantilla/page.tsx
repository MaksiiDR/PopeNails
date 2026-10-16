import type { Metadata } from 'next'
import PageHeader from '../components/PageHeader'
import PostTemplate from '../components/PostTemplate'

export const metadata: Metadata = {
  title: 'Plantilla de posts — Pope Nails',
}

export default function PlantillaPage() {
  return (
    <div className="min-h-screen bg-pn-ivory">
      <PageHeader kicker="Instagram" title="Plantilla de posts" />
      <main className="max-w-[430px] mx-auto px-4 py-5 pb-16">
        <PostTemplate />
      </main>
    </div>
  )
}
