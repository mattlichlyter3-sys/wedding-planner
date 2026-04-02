import { createClient } from '@/lib/supabase/server'
import BudgetTable from '@/components/budget/BudgetTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import AddBudgetItemButton from '@/components/budget/AddBudgetItemButton'

export default async function BudgetPage() {
  const supabase = await createClient()

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase
      .from('budget_items')
      .select('*')
      .order('created_at', { ascending: true }),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
          <p className="text-sm text-gray-500 mt-1">Track all wedding expenses by category</p>
        </div>
        <AddBudgetItemButton categories={categories ?? []} />
      </div>

      <BudgetTable items={items ?? []} categories={categories ?? []} />
    </div>
  )
}
