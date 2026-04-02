import { createClient } from '@/lib/supabase/server'
import MenuProvidersList from '@/components/menu/MenuProvidersList'

export default async function MenuPage() {
  const supabase = await createClient()

  const [{ data: providers }, { data: allItems }] = await Promise.all([
    supabase.from('menu_providers').select('*').order('created_at', { ascending: true }),
    supabase.from('menu_items').select('provider_id, total_cost'),
  ])

  const providersWithTotals = (providers ?? []).map((p) => {
    const items = (allItems ?? []).filter((i) => i.provider_id === p.id)
    return {
      ...p,
      total: items.reduce((sum, i) => sum + (i.total_cost ?? 0), 0),
      itemCount: items.length,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
        <p className="text-sm text-gray-500 mt-1">Caterers and food providers</p>
      </div>
      <MenuProvidersList providers={providersWithTotals} />
    </div>
  )
}
