export const WEDDING_DATE = new Date('2026-05-08T00:00:00')

export const SUGGESTION_CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'music', label: 'Music' },
  { value: 'decor', label: 'Decor' },
  { value: 'venue', label: 'Venue' },
  { value: 'activity', label: 'Activity' },
  { value: 'other', label: 'Other' },
] as const

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/budget', label: 'Budget', icon: 'DollarSign' },
  { href: '/calendar', label: 'Calendar', icon: 'Calendar' },
  { href: '/menu', label: 'Menu', icon: 'UtensilsCrossed' },
  { href: '/suggestions', label: 'Suggestions', icon: 'MessageSquare' },
] as const
