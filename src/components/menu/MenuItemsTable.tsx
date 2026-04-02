'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { deleteMenuItem } from '@/actions/menu'
import MenuItemForm from './MenuItemForm'
import type { Database } from '@/lib/supabase/types'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

interface MenuItemsTableProps {
  items: MenuItem[]
  providerId: string
}

export default function MenuItemsTable({ items, providerId }: MenuItemsTableProps) {
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const total = items.reduce((s, i) => s + (i.total_cost ?? 0), 0)

  function handleDelete(id: string) {
    if (!confirm('Delete this menu item?')) return
    startTransition(async () => {
      const result = await deleteMenuItem(id, providerId)
      if (result.success) toast.success('Item deleted')
      else toast.error(result.error)
    })
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Menu Items</h2>
          <Button size="sm" onClick={() => setAddOpen(true)} className="bg-pink-500 hover:bg-pink-600">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No menu items yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left hidden sm:table-cell">Description</th>
                  <th className="px-4 py-2 text-right">Per Person</th>
                  <th className="px-4 py-2 text-right hidden sm:table-cell">Flat Cost</th>
                  <th className="px-4 py-2 text-right hidden sm:table-cell">Qty</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.item_name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-[200px] truncate">
                      {item.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.cost_per_person)}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">{formatCurrency(item.flat_cost)}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{formatCurrency(item.total_cost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditItem(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-400 hover:text-red-600"
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={5} className="px-4 py-2 text-right text-gray-600">Total</td>
                  <td className="px-4 py-2 text-right text-gray-900">{formatCurrency(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
          {editItem && (
            <MenuItemForm item={editItem} providerId={providerId} onSuccess={() => setEditItem(null)} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
          <MenuItemForm providerId={providerId} onSuccess={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
