'use client'

import { useState, useEffect } from 'react'
import { supabase, ShoppingItem } from '@/lib/supabase'

export default function ShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItemName, setNewItemName] = useState('')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching shopping items:', error)
    } else {
      setItems(data || [])
    }
    setLoading(false)
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    const tempName = newItemName.trim()
    setNewItemName('')
    
    const { error } = await supabase
      .from('shopping_items')
      .insert([{ name: tempName }])
      
    if (error) {
      console.error('Error adding item:', error)
      setNewItemName(tempName) // restore input on failure
    } else {
      fetchItems()
    }
  }

  const handleDeleteItem = async (id: string) => {
    // Optimistic delete
    setItems(prev => prev.filter(item => item.id !== id))
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id)
      
    if (error) {
      console.error('Error deleting item:', error)
      fetchItems() // revert on error
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-12" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Agregar */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <label htmlFor="new-item" className="sr-only">
          Nuevo artículo
        </label>
        <input
          id="new-item"
          type="text"
          placeholder="Ej: Removedor de cutícula"
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          className="pn-input flex-1 min-w-0"
          autoComplete="off"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full px-5 font-bold text-[15px] bg-pn-ink text-[#f3ece0] transition-opacity hover:opacity-90 disabled:opacity-40"
          disabled={!newItemName.trim() || loading}
        >
          Añadir
        </button>
      </form>

      {/* Lista */}
      <section>
        <div className="flex items-center gap-3 mb-3 px-1">
          <h2 className="pn-label text-pn-gold">Por comprar</h2>
          <span className="flex-1 h-px bg-pn-line" aria-hidden="true" />
          <span className="text-[11px] font-bold text-pn-muted">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-pn-line px-5 py-8 text-center">
            <p className="font-display text-[22px] font-medium">Todo comprado</p>
            <p className="text-sm text-pn-muted mt-1">Anota aquí lo que se te vaya acabando.</p>
          </div>
        ) : (
          <ul className="rounded-2xl border border-pn-line bg-pn-paper divide-y divide-pn-line overflow-hidden">
            {items.map(item => (
              <li key={item.id} className="flex items-center gap-3 pl-4 pr-2 py-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pn-gold shrink-0" aria-hidden="true" />
                <span className="flex-1 min-w-0 text-[15px] font-semibold break-words">{item.name}</span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold text-pn-muted border border-pn-line transition-colors hover:bg-pn-ivory active:scale-95"
                  aria-label={`Marcar ${item.name} como comprado`}
                >
                  Listo
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
