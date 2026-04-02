'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  UtensilsCrossed,
  MessageSquare,
  Settings,
  Heart,
  LogOut,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/budget', label: 'Budget', icon: DollarSign },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/suggestions', label: 'Suggestions', icon: MessageSquare },
]

interface SidebarProps {
  userEmail: string
  userName: string
  isAdmin: boolean
}

export default function Sidebar({ userEmail, userName, isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 py-4">
      {/* Logo */}
      <div className="px-4 mb-6 flex items-center gap-2">
        <Heart className="h-6 w-6 text-pink-500 fill-pink-500 shrink-0" />
        <span className="font-semibold text-gray-800 truncate">Wedding Planner</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-pink-50 text-pink-600'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <Link
            href="/admin/users"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-pink-50 text-pink-600'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Admin
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="px-3 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 py-1 mb-1">
          <div className="h-7 w-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {getInitials(userName || userEmail)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">{userName || userEmail}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-gray-500 hover:text-gray-800 rounded transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
