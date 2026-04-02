'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

const CalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  event_date: z.string().min(1, 'Date is required'),
  event_time: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  budget_item_id: z.string().uuid().optional().nullable(),
})

type ActionResult = { success: true } | { success: false; error: string }

export async function createCalendarEvent(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = CalendarEventSchema.safeParse({
    title: formData.get('title'),
    event_date: formData.get('event_date'),
    event_time: formData.get('event_time') || null,
    description: formData.get('description') || null,
    budget_item_id: formData.get('budget_item_id') || null,
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'calendar_events',
    recordId: data.id,
    action: 'INSERT',
    newValues: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateCalendarEvent(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = CalendarEventSchema.safeParse({
    title: formData.get('title'),
    event_date: formData.get('event_date'),
    event_time: formData.get('event_time') || null,
    description: formData.get('description') || null,
    budget_item_id: formData.get('budget_item_id') || null,
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data: existing } = await supabase.from('calendar_events').select('*').eq('id', id).single()

  const { data, error } = await supabase
    .from('calendar_events')
    .update({ ...parsed.data, updated_by: user.id })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'calendar_events',
    recordId: id,
    action: 'UPDATE',
    oldValues: existing as unknown as Record<string, unknown>,
    newValues: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteCalendarEvent(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: existing } = await supabase.from('calendar_events').select('*').eq('id', id).single()
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'calendar_events',
    recordId: id,
    action: 'DELETE',
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath('/calendar')
  revalidatePath('/dashboard')
  return { success: true }
}
