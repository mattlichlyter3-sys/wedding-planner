'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, ExternalLink, CheckCircle } from 'lucide-react'
import { deleteProvider } from '@/actions/menu'
import ProviderForm from './ProviderForm'
import type { Database } from '@/lib/supabase/types'

type MenuProvider = Database['public']['Tables']['menu_providers']['Row'] & {
  total: number
  itemCount: number
}

export default function MenuProvidersList({ providers }: { providers: MenuProvider[] }) {
  const [editProvider, setEditProvider] = useState<MenuProvider | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Delete this provider and all its menu items?')) return
    startTransition(async () => {
      const result = await deleteProvider(id)
      if (result.success) toast.success('Provider deleted')
      else toast.error(result.error)
    })
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <Button onClick={() => setAddOpen(true)} className="bg-pink-500 hover:bg-pink-600">
          <Plus className="h-4 w-4 mr-1" />
          Add Provider
        </Button>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No caterers added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => (
            <Card key={p.id} className={p.is_selected ? 'ring-2 ring-pink-400' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{p.name}</CardTitle>
                    {p.contact_name && (
                      <p className="text-sm text-gray-500">{p.contact_name}</p>
                    )}
                  </div>
                  {p.is_selected && (
                    <Badge className="bg-pink-500 text-white shrink-0 text-xs">Selected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">Items</span>
                    <p className="font-medium">{p.itemCount}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Est. Total</span>
                    <p className="font-medium">{formatCurrency(p.total)}</p>
                  </div>
                </div>

                {(p.contact_phone || p.contact_email) && (
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {p.contact_phone && <p>{p.contact_phone}</p>}
                    {p.contact_email && <p>{p.contact_email}</p>}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Link href={`/menu/${p.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      View Menu
                    </Button>
                  </Link>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditProvider(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-400 hover:text-red-600"
                    onClick={() => handleDelete(p.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editProvider} onOpenChange={(o) => !o && setEditProvider(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Provider</DialogTitle></DialogHeader>
          {editProvider && (
            <ProviderForm provider={editProvider} onSuccess={() => setEditProvider(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Provider</DialogTitle></DialogHeader>
          <ProviderForm onSuccess={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
