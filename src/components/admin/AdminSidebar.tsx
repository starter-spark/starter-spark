'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Star,
  KeyRound,
  CreditCard,
  MessageSquare,
  Calendar,
  Users,
  BarChart3,
  LogOut,
  FileText,
  ScrollText,
  Megaphone,
  LifeBuoy,
  GraduationCap,
  BookOpen,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/learn', label: 'Learn', icon: GraduationCap },
  { href: '/admin/licenses', label: 'Licenses', icon: KeyRound },
  { href: '/admin/orders', label: 'Orders', icon: CreditCard },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/community', label: 'Community', icon: MessageSquare },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/cms', label: 'CMS', icon: Database },
  { href: '/admin/docs', label: 'Docs', icon: BookOpen },
  { href: '/admin/banners', label: 'Banners', icon: Megaphone },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

interface AdminSidebarProps {
  user: {
    email: string
    name: string | null
    role: string
  }
  collapsed?: boolean
  onToggleCollapsed?: () => void
  onNavigate?: () => void
  variant?: 'desktop' | 'mobile'
}

export function AdminSidebar({
  user,
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
  variant = 'desktop',
}: AdminSidebarProps) {
  const pathname = usePathname()

  const canCollapse =
    variant === 'desktop' && typeof onToggleCollapsed === 'function'

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-white',
        variant === 'mobile'
          ? 'w-full'
          : cn(
              'border-r border-slate-200 transition-[width] duration-200',
              collapsed ? 'w-[72px]' : 'w-64',
            ),
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex h-16 items-center justify-between border-b border-slate-200 px-4',
          collapsed && 'px-2',
        )}
      >
        <div
          className={cn(
            'flex min-w-0 items-center gap-2',
            collapsed && 'justify-center',
          )}
        >
          <Link
            href="/"
            onClick={() => onNavigate?.()}
            className="font-mono text-sm font-bold text-cyan-700 hover:text-cyan-600 transition-colors"
          >
            <span className={cn(collapsed && 'sr-only')}>StarterSpark</span>
            <span className={cn(!collapsed && 'sr-only')}>SS</span>
          </Link>
          <span className={cn('text-slate-300', collapsed && 'sr-only')}>
            /
          </span>
          <Link
            href="/admin"
            onClick={() => onNavigate?.()}
            className={cn(
              'font-mono text-sm font-semibold text-slate-900 hover:text-slate-600 transition-colors',
              collapsed && 'sr-only',
            )}
          >
            Admin
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {canCollapse ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onToggleCollapsed?.()}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
              <span className="sr-only">
                {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </span>
            </Button>
          ) : null}
        </div>
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
                onClick={() => onNavigate?.()}
                className={cn(
                  'flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-cyan-50 text-cyan-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4" />
                <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className={cn('border-t border-slate-200 p-4', collapsed && 'px-2')}>
        {!collapsed ? (
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.name || user.email}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <span className="mt-1 inline-block rounded bg-cyan-100 px-2 py-0.5 font-mono text-xs text-cyan-700">
              {user.role}
            </span>
          </div>
        ) : null}

        <Separator className={cn('my-3', collapsed && 'sr-only')} />
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="ghost"
            className={cn(
              'w-full justify-start text-slate-600 hover:text-slate-900',
              collapsed && 'justify-center px-0',
            )}
            size="sm"
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className={cn('h-4 w-4', collapsed ? 'mr-0' : 'mr-2')} />
            <span className={cn(collapsed && 'sr-only')}>Sign out</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
