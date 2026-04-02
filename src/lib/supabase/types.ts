export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SuggestionCategory = 'food' | 'music' | 'decor' | 'venue' | 'activity' | 'other'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          is_admin: boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          is_admin?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          email?: string
          is_admin?: boolean
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          color: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
          sort_order?: number
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          id: string
          category_id: string
          vendor_name: string
          vendor_contact: string | null
          estimated_cost: number
          actual_cost: number | null
          deposit_paid: number
          balance_due: number
          confirmed: boolean
          notes: string | null
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          vendor_name: string
          vendor_contact?: string | null
          estimated_cost?: number
          actual_cost?: number | null
          deposit_paid?: number
          confirmed?: boolean
          notes?: string | null
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          vendor_name?: string
          vendor_contact?: string | null
          estimated_cost?: number
          actual_cost?: number | null
          deposit_paid?: number
          confirmed?: boolean
          notes?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          id: string
          title: string
          event_date: string
          event_time: string | null
          description: string | null
          budget_item_id: string | null
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          event_date: string
          event_time?: string | null
          description?: string | null
          budget_item_id?: string | null
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          event_date?: string
          event_time?: string | null
          description?: string | null
          budget_item_id?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      menu_providers: {
        Row: {
          id: string
          name: string
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          website: string | null
          notes: string | null
          is_selected: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          notes?: string | null
          is_selected?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          website?: string | null
          notes?: string | null
          is_selected?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          id: string
          provider_id: string
          item_name: string
          description: string | null
          cost_per_person: number | null
          flat_cost: number | null
          quantity: number
          total_cost: number | null
          sort_order: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          item_name: string
          description?: string | null
          cost_per_person?: number | null
          flat_cost?: number | null
          quantity?: number
          sort_order?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          item_name?: string
          description?: string | null
          cost_per_person?: number | null
          flat_cost?: number | null
          quantity?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          id: string
          submitter_name: string
          suggestion_text: string
          category: SuggestionCategory
          is_reviewed: boolean
          admin_notes: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          submitter_name: string
          suggestion_text: string
          category?: SuggestionCategory
          is_reviewed?: boolean
          admin_notes?: string | null
          submitted_at?: string
        }
        Update: {
          is_reviewed?: boolean
          admin_notes?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          user_email: string | null
          table_name: string
          record_id: string
          action: AuditAction
          old_values: Json | null
          new_values: Json | null
          changed_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_email?: string | null
          table_name: string
          record_id: string
          action: AuditAction
          old_values?: Json | null
          new_values?: Json | null
          changed_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: {
      suggestion_category: SuggestionCategory
      audit_action: AuditAction
    }
    CompositeTypes: Record<never, never>
  }
}
