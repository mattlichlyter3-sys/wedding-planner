import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft } from 'lucide-react'
import MenuItemsTable from '@/components/menu/MenuItemsTable'

export default async function ProviderDetailPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params
  const supabase = await createClient()

  const [{ data: provider }, { data: items }] = await Promise.all([
    supabase.from('menu_providers').select('*').eq('id', providerId).single(),
    supabase.from('menu_items').select('*').eq('provider_id', providerId).order('sort_order').order('created_at'),
  ])

  if (!provider) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/menu">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{provider.name}</h1>
            {provider.is_selected && (
              <Badge className="bg-pink-500 text-white">Selected Caterer</Badge>
            )}
          </div>
          {provider.contact_name && (
            <p className="text-sm text-gray-500">{provider.contact_name}</p>
          )}
        </div>
      </div>

      {/* Provider info */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        {provider.contact_phone && (
          <div>
            <span className="text-xs text-gray-400">Phone</span>
            <p>{provider.contact_phone}</p>
          </div>
        )}
        {provider.contact_email && (
          <div>
            <span className="text-xs text-gray-400">Email</span>
            <p className="truncate">{provider.contact_email}</p>
          </div>
        )}
        {provider.website && (
          <div>
            <span className="text-xs text-gray-400">Website</span>
            <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:underline truncate block">
              {provider.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        {provider.notes && (
          <div className="col-span-2 sm:col-span-4">
            <span className="text-xs text-gray-400">Notes</span>
            <p className="text-gray-600">{provider.notes}</p>
          </div>
        )}
      </div>

      <MenuItemsTable items={items ?? []} providerId={provider.id} />
    </div>
  )
}
