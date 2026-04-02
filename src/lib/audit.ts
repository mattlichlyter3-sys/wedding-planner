import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuditAction } from './supabase/types'

interface AuditLogParams {
  supabase: SupabaseClient
  userId: string | null
  userEmail: string | null
  tableName: string
  recordId: string
  action: AuditAction
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}

export async function auditLog({
  supabase,
  userId,
  userEmail,
  tableName,
  recordId,
  action,
  oldValues,
  newValues,
}: AuditLogParams) {
  await supabase.from('audit_log').insert({
    user_id: userId,
    user_email: userEmail,
    table_name: tableName,
    record_id: recordId,
    action,
    old_values: oldValues ?? null,
    new_values: newValues ?? null,
  })
}
