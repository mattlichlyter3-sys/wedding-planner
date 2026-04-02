'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import BudgetItemForm from './BudgetItemForm'
import { Plus } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Category = Database['public']['Tables']['categories']['Row']

export default function AddBudgetItemButton({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-pink-500 hover:bg-pink-600">
        <Plus className="h-4 w-4 mr-1" />
        Add Item
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
          </DialogHeader>
          <BudgetItemForm categories={categories} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
