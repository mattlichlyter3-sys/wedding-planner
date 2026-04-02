'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

const BudgetItemSchema = z.object({
  category_id: z.string().uuid(),
  vendor_name: z.string().min(1, 'Vendor name is required'),
  vendor_contact: z.string().optional().nullable(),
  estimated_cost: z.coerce.number().min(0),
  actual_cost: z.coerce.number().min(0).optional().nullable(),
  deposit_paid: z.coerce.number().min(0).optional().default(0),
  confirmed: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
})

type ActionResult = { success: true } | { success: false; error: string }

export async function createBudgetItem(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = BudgetItemSchema.safeParse({
    category_id: formData.get('category_id'),
    vendor_name: formData.get('vendor_name'),
    vendor_contact: formData.get('vendor_contact') || null,
    estimated_cost: formData.get('estimated_cost'),
    actual_cost: formData.get('actual_cost') || null,
    deposit_paid: formData.get('deposit_paid') || 0,
    confirmed: formData.get('confirmed') === 'true',
    notes: formData.get('notes') || null,
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data, error } = await supabase
    .from('budget_items')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'budget_items',
    recordId: data.id,
    action: 'INSERT',
    newValues: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/budget')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateBudgetItem(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = BudgetItemSchema.safeParse({
    category_id: formData.get('category_id'),
    vendor_name: formData.get('vendor_name'),
    vendor_contact: formData.get('vendor_contact') || null,
    estimated_cost: formData.get('estimated_cost'),
    actual_cost: formData.get('actual_cost') || null,
    deposit_paid: formData.get('deposit_paid') || 0,
    confirmed: formData.get('confirmed') === 'true',
    notes: formData.get('notes') || null,
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data: existing } = await supabase
    .from('budget_items')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('budget_items')
    .update({ ...parsed.data, updated_by: user.id })
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'budget_items',
    recordId: id,
    action: 'UPDATE',
    oldValues: existing as unknown as Record<string, unknown>,
    newValues: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/budget')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteBudgetItem(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('budget_items')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('budget_items').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'budget_items',
    recordId: id,
    action: 'DELETE',
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath('/budget')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleConfirmed(id: string, confirmed: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('budget_items')
    .update({ confirmed, updated_by: user.id })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'budget_items',
    recordId: id,
    action: 'UPDATE',
    newValues: { confirmed },
  })

  revalidatePath('/budget')
  revalidatePath('/dashboard')
  return { success: true }
}
