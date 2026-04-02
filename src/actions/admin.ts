'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type ActionResult = { success: true } | { success: false; error: string }

export async function toggleAdminStatus(targetUserId: string, makeAdmin: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { success: false, error: 'Forbidden' }

  // Prevent self-demotion
  if (targetUserId === user.id && !makeAdmin) {
    return { success: false, error: 'You cannot remove your own admin access' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: makeAdmin })
    .eq('id', targetUserId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function revokeUserAccess(targetUserId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { success: false, error: 'Forbidden' }

  if (targetUserId === user.id) return { success: false, error: 'You cannot revoke your own access' }

  const adminSupabase = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminSupabase.auth.admin.deleteUser(targetUserId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}
