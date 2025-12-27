'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  KeyRound,
  CreditCard,
  MessageSquare,
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  FileText,
  ScrollText,
  Megaphone,
  LifeBuoy,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/learn', label: 'Learn', icon: GraduationCap },
  { href: '/admin/licenses', label: 'Licenses', icon: KeyRound },
  { href: '/admin/orders', label: 'Orders', icon: CreditCard },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/community', label: 'Community', icon: MessageSquare },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/banners', label: 'Banners', icon: Megaphone },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

interface AdminSidebarProps {
  user: {
    email: string
    name: string | null
    role: string
  }
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full min-h-0 w-64 flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="font-mono text-sm font-bold text-cyan-700 hover:text-cyan-600 transition-colors"
          >
            StarterSpark
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            href="/admin"
            className="font-mono text-sm font-semibold text-slate-900 hover:text-slate-600 transition-colors"
          >
            Admin
          </Link>
        </div>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Back to site"
        >
          <Link href="/" aria-label="Back to site">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-cyan-50 text-cyan-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3">
          <p className="truncate text-sm font-medium text-slate-900">
            {user.name || user.email}
          </p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
          <span className="mt-1 inline-block rounded bg-cyan-100 px-2 py-0.5 font-mono text-xs text-cyan-700">
            {user.role}
          </span>
        </div>
        <Separator className="my-3" />
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-slate-900"
            size="sm"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}
