'use client'

import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { deleteCalendarEvent } from '@/actions/calendar'
import EventForm from './EventForm'
import type { Database } from '@/lib/supabase/types'

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row']
type BudgetItem = Database['public']['Tables']['budget_items']['Row']

interface CalendarViewProps {
  events: CalendarEvent[]
  budgetItems: BudgetItem[]
}

export default function CalendarView({ events, budgetItems }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState<'calendar' | 'list'>('list')
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    const key = e.event_date
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return
    const result = await deleteCalendarEvent(id)
    if (result.success) toast.success('Event deleted')
    else toast.error(result.error)
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  )

  // Group by month for list view
  const eventsByMonth: Record<string, CalendarEvent[]> = {}
  for (const e of sortedEvents) {
    const key = e.event_date.slice(0, 7)
    if (!eventsByMonth[key]) eventsByMonth[key] = []
    eventsByMonth[key].push(e)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setAddOpen(true)} className="bg-pink-500 hover:bg-pink-600">
          <Plus className="h-4 w-4 mr-1" />
          Add Event
        </Button>
      </div>

      {view === 'list' ? (
        <div className="space-y-6">
          {sortedEvents.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No events yet</p>
          ) : (
            Object.entries(eventsByMonth).map(([monthKey, monthEvents]) => (
              <div key={monthKey}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {format(parseISO(monthKey + '-01'), 'MMMM yyyy')}
                </h3>
                <div className="space-y-2">
                  {monthEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-center min-w-[36px]">
                          <div className="text-xs text-gray-400">{format(parseISO(event.event_date), 'EEE')}</div>
                          <div className="text-lg font-bold text-pink-500 leading-none">
                            {format(parseISO(event.event_date), 'd')}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{event.title}</p>
                          {event.event_time && (
                            <p className="text-xs text-gray-400">{event.event_time.slice(0, 5)}</p>
                          )}
                          {event.description && (
                            <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditEvent(event)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-400 hover:text-red-600"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Calendar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="px-1 py-2 text-center text-xs font-medium text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDate[dateKey] ?? []

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'min-h-[60px] p-1 border-b border-r border-gray-100 last:border-r-0',
                    !isSameMonth(day, currentMonth) && 'bg-gray-50'
                  )}
                >
                  <div
                    className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                      isToday(day) && 'bg-pink-500 text-white',
                      !isToday(day) && isSameMonth(day, currentMonth) && 'text-gray-700',
                      !isSameMonth(day, currentMonth) && 'text-gray-300'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className="text-xs bg-pink-100 text-pink-700 rounded px-1 py-0.5 truncate cursor-pointer hover:bg-pink-200"
                        onClick={() => setEditEvent(e)}
                        title={e.title}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-400">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editEvent} onOpenChange={(o) => !o && setEditEvent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
          {editEvent && (
            <EventForm
              event={editEvent}
              budgetItems={budgetItems}
              onSuccess={() => setEditEvent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
          <EventForm budgetItems={budgetItems} onSuccess={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
