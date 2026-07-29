'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Home, Menu } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface AdminShellProps {
  user: {
    email: string
    name: string | null
    role: string
  }
  children: React.ReactNode
}

const SIDEBAR_COLLAPSED_KEY = 'admin.sidebar.collapsed'

function safeGetLocalStorage(key: string): string | null {
  try {
    return globalThis.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string) {
  try {
    globalThis.localStorage.setItem(key, value)
  } catch {
    // Ignore (private mode, quota, etc.).
  }
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    return safeGetLocalStorage(SIDEBAR_COLLAPSED_KEY) === '1'
  })

  useEffect(() => {
    safeSetLocalStorage(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <div className="flex h-full min-h-0 w-full">
      <div className="hidden h-full min-h-0 lg:flex">
        <AdminSidebar
          user={user}
          collapsed={collapsed}
          onToggleCollapsed={() => {
            setCollapsed((v) => !v)
          }}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Open admin navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <AdminSidebar
                user={user}
                variant="mobile"
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-semibold text-slate-900">
              Admin
            </p>
            <p className="truncate text-xs text-slate-500">
              {user.name || user.email}
            </p>
          </div>

          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/" aria-label="Back to site">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
