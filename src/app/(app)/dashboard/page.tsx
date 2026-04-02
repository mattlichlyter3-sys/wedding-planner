import { createClient } from '@/lib/supabase/server'
import { WEDDING_DATE } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { differenceInDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Calendar, DollarSign, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [budgetResult, eventsResult] = await Promise.all([
    supabase
      .from('budget_items')
      .select('estimated_cost, actual_cost, confirmed'),
    supabase
      .from('calendar_events')
      .select('id, title, event_date, event_time')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(5),
  ])

  const items = budgetResult.data ?? []
  const events = eventsResult.data ?? []

  const totalEstimated = items.reduce((sum, i) => sum + (i.estimated_cost ?? 0), 0)
  const totalActual = items.reduce((sum, i) => sum + (i.actual_cost ?? i.estimated_cost ?? 0), 0)
  const confirmedCount = items.filter((i) => i.confirmed).length
  const confirmedPct = items.length > 0 ? Math.round((confirmedCount / items.length) * 100) : 0

  const daysRemaining = differenceInDays(WEDDING_DATE, new Date())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to your wedding planning hub</p>
      </div>

      {/* Countdown */}
      <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Days Until the Wedding</p>
              <p className="text-6xl font-bold mt-1">{daysRemaining}</p>
              <p className="text-pink-100 mt-1">May 8, 2026</p>
            </div>
            <Heart className="h-16 w-16 text-pink-200 fill-pink-200 opacity-50" />
          </div>
        </CardContent>
      </Card>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Estimated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEstimated)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalActual)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{confirmedPct}%</p>
            <p className="text-xs text-gray-500 mt-1">{confirmedCount} of {items.length} items</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${confirmedPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-pink-500" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No upcoming events</p>
          ) : (
            <ul className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="flex items-start gap-3">
                  <div className="text-center min-w-[40px]">
                    <Badge variant="outline" className="text-xs font-mono whitespace-nowrap">
                      {formatDate(event.event_date)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{event.title}</p>
                    {event.event_time && (
                      <p className="text-xs text-gray-500">{event.event_time.slice(0, 5)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
