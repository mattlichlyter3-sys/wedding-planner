'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { createProvider, updateProvider } from '@/actions/menu'
import type { Database } from '@/lib/supabase/types'

type MenuProvider = Database['public']['Tables']['menu_providers']['Row']

interface ProviderFormProps {
  provider?: MenuProvider
  onSuccess?: () => void
}

export default function ProviderForm({ provider, onSuccess }: ProviderFormProps) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = provider
        ? await updateProvider(provider.id, formData)
        : await createProvider(formData)

      if (result.success) {
        toast.success(provider ? 'Provider updated' : 'Provider added')
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Provider Name</Label>
        <Input id="name" name="name" defaultValue={provider?.name} placeholder="e.g. Maple Catering Co." required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="contact_name">Contact Name</Label>
          <Input id="contact_name" name="contact_name" defaultValue={provider?.contact_name ?? ''} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact_phone">Phone</Label>
          <Input id="contact_phone" name="contact_phone" defaultValue={provider?.contact_phone ?? ''} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact_email">Email</Label>
          <Input id="contact_email" name="contact_email" type="email" defaultValue={provider?.contact_email ?? ''} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" defaultValue={provider?.website ?? ''} placeholder="https://..." />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={provider?.notes ?? ''} rows={3} />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="is_selected" name="is_selected" value="true" defaultChecked={provider?.is_selected ?? false} />
        <Label htmlFor="is_selected" className="font-normal cursor-pointer">Mark as selected caterer</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button type="submit" disabled={isPending} className="bg-pink-500 hover:bg-pink-600">
          {isPending ? 'Saving…' : provider ? 'Update Provider' : 'Add Provider'}
        </Button>
      </div>
    </form>
  )
}
