'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createBudgetItem, updateBudgetItem } from '@/actions/budget'
import type { Database } from '@/lib/supabase/types'

type Category = Database['public']['Tables']['categories']['Row']
type BudgetItem = Database['public']['Tables']['budget_items']['Row']

interface BudgetItemFormProps {
  categories: Category[]
  item?: BudgetItem
  onSuccess?: () => void
}

export default function BudgetItemForm({ categories, item, onSuccess }: BudgetItemFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = item
        ? await updateBudgetItem(item.id, formData)
        : await createBudgetItem(formData)

      if (result.success) {
        toast.success(item ? 'Item updated' : 'Item added')
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="category_id">Category</Label>
          <Select name="category_id" defaultValue={item?.category_id} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="vendor_name">Vendor Name</Label>
          <Input
            id="vendor_name"
            name="vendor_name"
            defaultValue={item?.vendor_name}
            placeholder="e.g. Sound & Celebration DJ"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="vendor_contact">Vendor Contact</Label>
          <Input
            id="vendor_contact"
            name="vendor_contact"
            defaultValue={item?.vendor_contact ?? ''}
            placeholder="Phone or email"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
          <Input
            id="estimated_cost"
            name="estimated_cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.estimated_cost ?? ''}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="actual_cost">Actual Cost ($)</Label>
          <Input
            id="actual_cost"
            name="actual_cost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.actual_cost ?? ''}
            placeholder="Leave blank if unknown"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="deposit_paid">Deposit Paid ($)</Label>
          <Input
            id="deposit_paid"
            name="deposit_paid"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.deposit_paid ?? 0}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={item?.notes ?? ''}
          placeholder="Any additional details..."
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="confirmed"
          name="confirmed"
          value="true"
          defaultChecked={item?.confirmed ?? false}
        />
        <Label htmlFor="confirmed" className="font-normal cursor-pointer">
          Confirmed with vendor
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="bg-pink-500 hover:bg-pink-600">
          {isPending ? 'Saving…' : item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  )
}
