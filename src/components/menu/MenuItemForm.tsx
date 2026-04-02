'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createMenuItem, updateMenuItem } from '@/actions/menu'
import type { Database } from '@/lib/supabase/types'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

interface MenuItemFormProps {
  item?: MenuItem
  providerId: string
  onSuccess?: () => void
}

export default function MenuItemForm({ item, providerId, onSuccess }: MenuItemFormProps) {
  const [isPending, startTransition] = useTransition()
  const [costType, setCostType] = useState<'per_person' | 'flat'>(
    item?.flat_cost != null ? 'flat' : 'per_person'
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('provider_id', providerId)

    // Zero out the unused cost field
    if (costType === 'per_person') {
      formData.set('flat_cost', '')
    } else {
      formData.set('cost_per_person', '')
    }

    startTransition(async () => {
      const result = item
        ? await updateMenuItem(item.id, formData)
        : await createMenuItem(formData)

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
      <div className="space-y-1">
        <Label htmlFor="item_name">Item Name</Label>
        <Input id="item_name" name="item_name" defaultValue={item?.item_name} placeholder="e.g. Grilled Salmon" required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={item?.description ?? ''} rows={2} />
      </div>

      <div className="space-y-2">
        <Label>Cost Type</Label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="cost_type"
              value="per_person"
              checked={costType === 'per_person'}
              onChange={() => setCostType('per_person')}
              className="accent-pink-500"
            />
            <span className="text-sm">Per person</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="cost_type"
              value="flat"
              checked={costType === 'flat'}
              onChange={() => setCostType('flat')}
              className="accent-pink-500"
            />
            <span className="text-sm">Flat cost</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {costType === 'per_person' ? (
          <div className="space-y-1">
            <Label htmlFor="cost_per_person">Cost Per Person ($)</Label>
            <Input
              id="cost_per_person"
              name="cost_per_person"
              type="number"
              min="0"
              step="0.01"
              defaultValue={item?.cost_per_person ?? ''}
              required
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="flat_cost">Flat Cost ($)</Label>
            <Input
              id="flat_cost"
              name="flat_cost"
              type="number"
              min="0"
              step="0.01"
              defaultValue={item?.flat_cost ?? ''}
              required
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="quantity">{costType === 'per_person' ? 'Guest Count' : 'Quantity'}</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            step="1"
            defaultValue={item?.quantity ?? 1}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-pink-500 hover:bg-pink-600">
          {isPending ? 'Saving…' : item ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  )
}
