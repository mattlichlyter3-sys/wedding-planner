'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2 } from 'lucide-react'
import { updateSuggestion, deleteSuggestion } from '@/actions/suggestions'
import type { Database, SuggestionCategory } from '@/lib/supabase/types'
import { format, parseISO } from 'date-fns'

type Suggestion = Database['public']['Tables']['suggestions']['Row']

const CATEGORY_COLORS: Record<SuggestionCategory, string> = {
  food: 'bg-amber-100 text-amber-700',
  music: 'bg-blue-100 text-blue-700',
  decor: 'bg-purple-100 text-purple-700',
  venue: 'bg-green-100 text-green-700',
  activity: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
}

export default function SuggestionsManager({ suggestions }: { suggestions: Suggestion[] }) {
  const [filter, setFilter] = useState<'all' | 'unreviewed' | 'reviewed'>('all')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = suggestions.filter((s) => {
    if (filter === 'unreviewed') return !s.is_reviewed
    if (filter === 'reviewed') return s.is_reviewed
    return true
  })

  function handleToggleReviewed(id: string, current: boolean) {
    startTransition(async () => {
      const result = await updateSuggestion(id, { is_reviewed: !current })
      if (!result.success) toast.error(result.error)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this suggestion?')) return
    startTransition(async () => {
      const result = await deleteSuggestion(id)
      if (result.success) toast.success('Deleted')
      else toast.error(result.error)
    })
  }

  function startEditNotes(suggestion: Suggestion) {
    setEditingNotes(suggestion.id)
    setNotesValue(suggestion.admin_notes ?? '')
  }

  function saveNotes(id: string) {
    startTransition(async () => {
      const result = await updateSuggestion(id, { admin_notes: notesValue })
      if (result.success) {
        setEditingNotes(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({suggestions.length})</TabsTrigger>
            <TabsTrigger value="unreviewed">Unreviewed ({suggestions.filter((s) => !s.is_reviewed).length})</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed ({suggestions.filter((s) => s.is_reviewed).length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No suggestions in this category</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-lg border p-4 space-y-2 ${s.is_reviewed ? 'border-gray-200 opacity-70' : 'border-gray-300'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800">{s.submitter_name}</span>
                    <Badge className={`text-xs ${CATEGORY_COLORS[s.category]} border-0`}>
                      {s.category}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {format(parseISO(s.submitted_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-gray-700">{s.suggestion_text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      checked={s.is_reviewed}
                      onCheckedChange={() => handleToggleReviewed(s.id, s.is_reviewed)}
                      disabled={isPending}
                    />
                    <span className="text-xs text-gray-500">Reviewed</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-400 hover:text-red-600"
                    onClick={() => handleDelete(s.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Admin notes */}
              {editingNotes === s.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveNotes(s.id)} disabled={isPending} className="bg-pink-500 hover:bg-pink-600">
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  className="text-xs text-gray-400 hover:text-gray-600 text-left"
                  onClick={() => startEditNotes(s)}
                >
                  {s.admin_notes ? (
                    <span className="italic text-gray-500">Note: {s.admin_notes}</span>
                  ) : (
                    '+ Add note'
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
