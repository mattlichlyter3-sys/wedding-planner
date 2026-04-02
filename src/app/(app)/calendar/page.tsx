import { createClient } from '@/lib/supabase/server'
import CalendarView from '@/components/calendar/CalendarView'

export default async function CalendarPage() {
  const supabase = await createClient()

  const [{ data: events }, { data: budgetItems }] = await Promise.all([
    supabase.from('calendar_events').select('*').order('event_date', { ascending: true }),
    supabase.from('budget_items').select('*').order('vendor_name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Key dates, appointments, and deadlines</p>
      </div>
      <CalendarView events={events ?? []} budgetItems={budgetItems ?? []} />
    </div>
  )
}
