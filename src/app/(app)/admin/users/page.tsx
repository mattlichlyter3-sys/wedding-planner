import { createClient } from '@/lib/supabase/server'
import UsersManager from '@/components/admin/UsersManager'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Invite and manage wedding planner access</p>
      </div>
      <UsersManager profiles={profiles ?? []} currentUserId={user?.id ?? ''} />
    </div>
  )
}
