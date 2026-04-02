import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

export async function POST(request: Request) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const body = await request.json()
  const { submitter_name, suggestion_text, category } = body

  if (!submitter_name?.trim() || !suggestion_text?.trim()) {
    return NextResponse.json({ error: 'Name and suggestion are required' }, { status: 400 })
  }

  const { error } = await supabase.from('suggestions').insert({
    submitter_name: submitter_name.trim(),
    suggestion_text: suggestion_text.trim(),
    category: category ?? 'other',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
