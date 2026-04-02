'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, DollarSign, Calendar, UtensilsCrossed, MessageSquare, Menu, Heart, Settings, LogOut, X } from 'lucide-react'
import { useState } from 'react'
import { cn, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budget', label: 'Budget', icon: DollarSign },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/suggestions', label: 'Suggestions', icon: MessageSquare },
]

interface MobileNavProps {
  userEmail: string
  userName: string
  isAdmin: boolean
  pageTitle: string
}

export default function MobileNav({ userEmail, userName, isAdmin, pageTitle }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
        <span className="font-semibold text-sm text-gray-800">{pageTitle}</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-0">
          <div className="flex flex-col h-full py-4">
            <div className="px-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                <span className="font-semibold text-gray-800">Wedding Planner</span>
              </div>
            </div>

            <nav className="flex-1 px-2 space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname.startsWith(href)
                      ? 'bg-pink-50 text-pink-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin/users"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-pink-50 text-pink-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </nav>

            <div className="px-3 pt-4 border-t border-gray-200 mt-4">
              <div className="flex items-center gap-3 px-2 py-1 mb-2">
                <div className="h-8 w-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-semibold">
                  {getInitials(userName || userEmail)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{userName || userEmail}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-2 py-2 text-sm text-gray-500 hover:text-gray-800 rounded"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
