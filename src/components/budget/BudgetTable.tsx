'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { deleteBudgetItem, toggleConfirmed } from '@/actions/budget'
import BudgetItemForm from './BudgetItemForm'
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Category = Database['public']['Tables']['categories']['Row']
type BudgetItem = Database['public']['Tables']['budget_items']['Row']

interface BudgetTableProps {
  items: BudgetItem[]
  categories: Category[]
}

export default function BudgetTable({ items, categories }: BudgetTableProps) {
  const [editItem, setEditItem] = useState<BudgetItem | null>(null)
  const [addCategory, setAddCategory] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const grouped = categories.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category_id === cat.id),
  })).filter((g) => g.items.length > 0 || true)

  const totals = {
    estimated: items.reduce((s, i) => s + (i.estimated_cost ?? 0), 0),
    actual: items.reduce((s, i) => s + (i.actual_cost ?? i.estimated_cost ?? 0), 0),
    deposit: items.reduce((s, i) => s + (i.deposit_paid ?? 0), 0),
    balance: items.reduce((s, i) => s + (i.balance_due ?? 0), 0),
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this budget item?')) return
    startTransition(async () => {
      const result = await deleteBudgetItem(id)
      if (result.success) toast.success('Item deleted')
      else toast.error(result.error)
    })
  }

  function handleToggleConfirmed(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleConfirmed(id, !current)
      if (!result.success) toast.error(result.error)
    })
  }

  return (
    <>
      <div className="space-y-4">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category_id === cat.id)
          const isCollapsed = collapsed[cat.id]
          const catTotal = catItems.reduce((s, i) => s + (i.estimated_cost ?? 0), 0)

          return (
            <div key={cat.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setCollapsed((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-gray-800">{cat.name}</span>
                  <Badge variant="secondary" className="text-xs">{catItems.length}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">{formatCurrency(catTotal)}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-pink-500 hover:text-pink-600 hover:bg-pink-50"
                    onClick={(e) => { e.stopPropagation(); setAddCategory(cat.id) }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </button>

              {!isCollapsed && (
                <>
                  {catItems.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400 border-t border-gray-100">
                      No items yet —{' '}
                      <button
                        className="text-pink-500 hover:underline"
                        onClick={() => setAddCategory(cat.id)}
                      >
                        add one
                      </button>
                    </div>
                  ) : (
                    <div className="border-t border-gray-100 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                            <th className="px-4 py-2 text-left">Vendor</th>
                            <th className="px-4 py-2 text-left hidden sm:table-cell">Contact</th>
                            <th className="px-4 py-2 text-right">Estimated</th>
                            <th className="px-4 py-2 text-right hidden sm:table-cell">Actual</th>
                            <th className="px-4 py-2 text-right hidden md:table-cell">Deposit</th>
                            <th className="px-4 py-2 text-right hidden md:table-cell">Balance</th>
                            <th className="px-4 py-2 text-center">✓</th>
                            <th className="px-4 py-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {catItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">
                                <div>{item.vendor_name}</div>
                                {item.notes && (
                                  <div className="text-xs text-gray-400 truncate max-w-[160px]" title={item.notes}>{item.notes}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                                {item.vendor_contact ?? '—'}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700">
                                {formatCurrency(item.estimated_cost)}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-700 hidden sm:table-cell">
                                {formatCurrency(item.actual_cost)}
                              </td>
                              <td className="px-4 py-3 text-right text-green-600 hidden md:table-cell">
                                {formatCurrency(item.deposit_paid)}
                              </td>
                              <td className="px-4 py-3 text-right text-orange-600 hidden md:table-cell">
                                {formatCurrency(item.balance_due)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Checkbox
                                  checked={item.confirmed}
                                  onCheckedChange={() => handleToggleConfirmed(item.id, item.confirmed)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => setEditItem(item)}
                                  >
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
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}

        {/* Totals */}
        {items.length > 0 && (
          <div className="bg-gray-800 text-white rounded-lg px-4 py-3">
            <div className="flex flex-wrap gap-4 justify-between text-sm">
              <div>
                <span className="text-gray-400 text-xs">Total Estimated</span>
                <p className="font-bold">{formatCurrency(totals.estimated)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Total Actual</span>
                <p className="font-bold">{formatCurrency(totals.actual)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Deposits Paid</span>
                <p className="font-bold text-green-400">{formatCurrency(totals.deposit)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs">Balance Due</span>
                <p className="font-bold text-orange-400">{formatCurrency(totals.balance)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Budget Item</DialogTitle>
          </DialogHeader>
          {editItem && (
            <BudgetItemForm
              categories={categories}
              item={editItem}
              onSuccess={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={!!addCategory} onOpenChange={(o) => !o && setAddCategory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
          </DialogHeader>
          {addCategory && (
            <BudgetItemForm
              categories={categories}
              item={{ category_id: addCategory } as BudgetItem}
              onSuccess={() => setAddCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
