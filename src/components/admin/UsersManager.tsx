'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { UserPlus, Trash2 } from 'lucide-react'
import { toggleAdminStatus, revokeUserAccess } from '@/actions/admin'
import { getInitials } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UsersManagerProps {
  profiles: Profile[]
  currentUserId: string
}

export default function UsersManager({ profiles, currentUserId }: UsersManagerProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError('')

    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, full_name: inviteName }),
    })

    const data = await res.json()
    setInviteLoading(false)

    if (!res.ok) {
      setInviteError(data.error ?? 'Failed to invite user')
    } else {
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteOpen(false)
      setInviteName('')
      setInviteEmail('')
    }
  }

  function handleToggleAdmin(userId: string, makeAdmin: boolean) {
    startTransition(async () => {
      const result = await toggleAdminStatus(userId, makeAdmin)
      if (!result.success) toast.error(result.error)
      else toast.success(makeAdmin ? 'Admin access granted' : 'Admin access removed')
    })
  }

  function handleRevoke(userId: string, name: string) {
    if (!confirm(`Remove ${name}'s access? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await revokeUserAccess(userId)
      if (!result.success) toast.error(result.error)
      else toast.success('Access revoked')
    })
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <Button onClick={() => setInviteOpen(true)} className="bg-pink-500 hover:bg-pink-600">
          <UserPlus className="h-4 w-4 mr-1" />
          Invite User
        </Button>
      </div>

      <div className="space-y-3">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-sm font-semibold shrink-0">
                {getInitials(profile.full_name || profile.email)}
              </div>
              <div>
                <p className="font-medium text-gray-800">{profile.full_name || '—'}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={profile.is_admin}
                  onCheckedChange={(checked) => handleToggleAdmin(profile.id, checked)}
                  disabled={isPending || profile.id === currentUserId}
                />
                <span className="text-sm text-gray-600">Admin</span>
              </div>

              {profile.id !== currentUserId && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-400 hover:text-red-600"
                  onClick={() => handleRevoke(profile.id, profile.full_name || profile.email)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="invite_name">Full Name</Label>
              <Input
                id="invite_name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite_email">Email Address</Label>
              <Input
                id="invite_email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jane@example.com"
                required
              />
            </div>
            {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
            <p className="text-xs text-gray-500">
              They will receive an email with a link to set their password.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviteLoading} className="bg-pink-500 hover:bg-pink-600">
                {inviteLoading ? 'Sending…' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
