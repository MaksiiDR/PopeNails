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
      <div className="animate-pulse bg-white rounded-2xl p-4 border shadow-sm h-32 flex items-center justify-center" style={{ borderColor: '#E5E5E5' }}>
        <div className="text-sm font-medium" style={{ color: '#666666' }}>Cargando lista de compras...</div>
      </div>
    )
  }

  return (
    <div 
      className="bg-white rounded-2xl p-5 border shadow-sm"
      style={{ borderColor: '#E5E5E5' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">🛍️</span>
        <h2
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#1A1A1A' }}
        >
          Lista de Compras
        </h2>
      </div>

      {/* Add form */}
      <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Ej: Removedor de cutícula..."
          value={newItemName}
          onChange={e => setNewItemName(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
          style={{ 
            backgroundColor: '#FAFAFA',
            border: '1.5px solid #E5E5E5',
            color: '#1A1A1A'
          }}
        />
        <button
          type="submit"
          className="rounded-xl px-4 py-2.5 font-bold text-sm text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: '#1A1A1A' }}
          disabled={!newItemName.trim() || loading}
        >
          Añadir
        </button>
      </form>

      {/* Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-center py-2" style={{ color: '#666666' }}>
            No tienes artículos en tu lista.
          </p>
        ) : (
          items.map(item => (
            <div 
              key={item.id}
              className="flex items-center justify-between group rounded-xl px-3 py-2 transition-colors hover:bg-gray-50"
              style={{ backgroundColor: '#FAFAFA', border: '1px solid #F0F0F0' }}
            >
              <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                {item.name}
              </span>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all hover:bg-gray-200 opacity-50 group-hover:opacity-100"
                style={{ color: '#1A1A1A' }}
                aria-label="Eliminar"
                title="Eliminar artículo"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
