import { createClient } from '@/lib/supabase/server'
import SuggestionsManager from '@/components/suggestions/SuggestionsManager'

export default async function SuggestionsPage() {
  const supabase = await createClient()

  const { data: suggestions } = await supabase
    .from('suggestions')
    .select('*')
    .order('submitted_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suggestions</h1>
          <p className="text-sm text-gray-500 mt-1">Ideas submitted by family and guests</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">Public link</p>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">/suggest</code>
        </div>
      </div>

      <SuggestionsManager suggestions={suggestions ?? []} />
    </div>
  )
}
