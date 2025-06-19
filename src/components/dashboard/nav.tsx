'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Leaf,
  Settings,
  Bell,
  HelpCircle,
  BarChart3,
  Target,
  Clock,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Portfolio',
    href: '/dashboard/portfolio',
    icon: Wallet,
  },
  {
    title: 'Investments',
    href: '/dashboard/investments',
    icon: TrendingUp,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'ESG Impact',
    href: '/dashboard/esg',
    icon: Leaf,
  },
  {
    title: 'Goals',
    href: '/dashboard/goals',
    icon: Target,
  },
  {
    title: 'Activity',
    href: '/dashboard/activity',
    icon: Clock,
  },
  {
    title: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    title: 'Help',
    href: '/dashboard/help',
    icon: HelpCircle,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex w-64 flex-col gap-2 border-r bg-card px-4 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold px-2">Navigation</h2>
      </div>
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}