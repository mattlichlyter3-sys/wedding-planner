'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { success: true } | { success: false; error: string }

export async function updateSuggestion(
  id: string,
  updates: { is_reviewed?: boolean; admin_notes?: string }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('suggestions').update(updates).eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/suggestions')
  return { success: true }
}

export async function deleteSuggestion(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('suggestions').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/suggestions')
  return { success: true }
}
