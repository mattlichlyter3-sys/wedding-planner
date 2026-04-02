'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCalendarEvent, updateCalendarEvent } from '@/actions/calendar'
import type { Database } from '@/lib/supabase/types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type BudgetItem = Database['public']['Tables']['budget_items']['Row']

interface EventFormProps {
  event?: CalendarEvent
  budgetItems?: BudgetItem[]
  onSuccess?: () => void
}

export default function EventForm({ event, budgetItems = [], onSuccess }: EventFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = event
        ? await updateCalendarEvent(event.id, formData)
        : await createCalendarEvent(formData)

      if (result.success) {
        toast.success(event ? 'Event updated' : 'Event added')
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={event?.title}
          placeholder="e.g. Cake tasting with baker"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="event_date">Date</Label>
          <Input
            id="event_date"
            name="event_date"
            type="date"
            defaultValue={event?.event_date}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="event_time">Time (optional)</Label>
          <Input
            id="event_time"
            name="event_time"
            type="time"
            defaultValue={event?.event_time ?? ''}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={event?.description ?? ''}
          placeholder="Additional details..."
          rows={3}
        />
      </div>

      {budgetItems.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor="budget_item_id">Link to Budget Item (optional)</Label>
          <Select name="budget_item_id" defaultValue={event?.budget_item_id ?? ''}>
            <SelectTrigger>
              <SelectValue placeholder="Select a vendor / budget item" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {budgetItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.vendor_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-pink-500 hover:bg-pink-600">
          {isPending ? 'Saving…' : event ? 'Update Event' : 'Add Event'}
        </Button>
      </div>
    </form>
  )
}
