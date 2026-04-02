'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { auditLog } from '@/lib/audit'
import { z } from 'zod'

const ProviderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact_name: z.string().optional().nullable(),
  contact_email: z.string().email().optional().nullable().or(z.literal('')),
  contact_phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_selected: z.boolean().optional().default(false),
})

const MenuItemSchema = z.object({
  provider_id: z.string().uuid(),
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional().nullable(),
  cost_per_person: z.coerce.number().min(0).optional().nullable(),
  flat_cost: z.coerce.number().min(0).optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
})

type ActionResult = { success: true } | { success: false; error: string }

export async function createProvider(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = ProviderSchema.safeParse({
    name: formData.get('name'),
    contact_name: formData.get('contact_name') || null,
    contact_email: formData.get('contact_email') || null,
    contact_phone: formData.get('contact_phone') || null,
    website: formData.get('website') || null,
    notes: formData.get('notes') || null,
    is_selected: formData.get('is_selected') === 'true',
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  // If marking as selected, unselect others
  if (parsed.data.is_selected) {
    await supabase.from('menu_providers').update({ is_selected: false }).neq('id', '')
  }

  const { data, error } = await supabase
    .from('menu_providers')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'menu_providers',
    recordId: data.id,
    action: 'INSERT',
    newValues: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/menu')
  return { success: true }
}

export async function updateProvider(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = ProviderSchema.safeParse({
    name: formData.get('name'),
    contact_name: formData.get('contact_name') || null,
    contact_email: formData.get('contact_email') || null,
    contact_phone: formData.get('contact_phone') || null,
    website: formData.get('website') || null,
    notes: formData.get('notes') || null,
    is_selected: formData.get('is_selected') === 'true',
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  if (parsed.data.is_selected) {
    await supabase.from('menu_providers').update({ is_selected: false }).neq('id', id)
  }

  const { data: existing } = await supabase.from('menu_providers').select('*').eq('id', id).single()

  const { data, error } = await supabase
    .from('menu_providers')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'menu_providers',
    recordId: id,
    action: 'UPDATE',
    oldValues: existing as unknown as Record<string, unknown>,
    newValues: data as unknown as Record<string, unknown>,
  })

  revalidatePath('/menu')
  revalidatePath(`/menu/${id}`)
  return { success: true }
}

export async function deleteProvider(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: existing } = await supabase.from('menu_providers').select('*').eq('id', id).single()
  const { error } = await supabase.from('menu_providers').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'menu_providers',
    recordId: id,
    action: 'DELETE',
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath('/menu')
  return { success: true }
}

export async function createMenuItem(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = MenuItemSchema.safeParse({
    provider_id: formData.get('provider_id'),
    item_name: formData.get('item_name'),
    description: formData.get('description') || null,
    cost_per_person: formData.get('cost_per_person') || null,
    flat_cost: formData.get('flat_cost') || null,
    quantity: formData.get('quantity') || 1,
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data, error } = await supabase
    .from('menu_items')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'menu_items',
    recordId: data.id,
    action: 'INSERT',
    newValues: data as unknown as Record<string, unknown>,
  })

  revalidatePath(`/menu/${parsed.data.provider_id}`)
  return { success: true }
}

export async function updateMenuItem(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const parsed = MenuItemSchema.safeParse({
    provider_id: formData.get('provider_id'),
    item_name: formData.get('item_name'),
    description: formData.get('description') || null,
    cost_per_person: formData.get('cost_per_person') || null,
    flat_cost: formData.get('flat_cost') || null,
    quantity: formData.get('quantity') || 1,
  })

  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const { data: existing } = await supabase.from('menu_items').select('*').eq('id', id).single()

  const { data, error } = await supabase
    .from('menu_items')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'menu_items',
    recordId: id,
    action: 'UPDATE',
    oldValues: existing as unknown as Record<string, unknown>,
    newValues: data as unknown as Record<string, unknown>,
  })

  revalidatePath(`/menu/${parsed.data.provider_id}`)
  return { success: true }
}

export async function deleteMenuItem(id: string, providerId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: existing } = await supabase.from('menu_items').select('*').eq('id', id).single()
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  await auditLog({
    supabase: serviceClient,
    userId: user.id,
    userEmail: user.email ?? null,
    tableName: 'menu_items',
    recordId: id,
    action: 'DELETE',
    oldValues: existing as unknown as Record<string, unknown>,
  })

  revalidatePath(`/menu/${providerId}`)
  return { success: true }
}
