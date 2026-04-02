import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_admin')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userEmail={user.email ?? ''}
        userName={profile?.full_name ?? ''}
        isAdmin={profile?.is_admin ?? false}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav
          userEmail={user.email ?? ''}
          userName={profile?.full_name ?? ''}
          isAdmin={profile?.is_admin ?? false}
          pageTitle="Wedding Planner"
        />
        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
