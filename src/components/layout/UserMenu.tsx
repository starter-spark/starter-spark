'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Settings, LogOut, Wrench, Shield, LogIn } from 'lucide-react'

interface UserMenuProps {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    avatar_seed: string | null
    role: string | null
  } | null
}

export function UserMenu({ user }: UserMenuProps) {
  // Not logged in, show sign-in button.
  if (!user) {
    return (
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/login" aria-label="Sign In">
          <LogIn className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sign In</span>
        </Link>
      </Button>
    )
  }

  const isAdminOrStaff = user.role === 'admin' || user.role === 'staff'

  const handleSignOut = () => {
    // Force a full page navigation to ensure server state is cleared
    window.location.href = '/auth/signout'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2"
          aria-label="User menu"
        >
          <UserAvatar
            user={{
              id: user.id,
              full_name: user.full_name,
              email: user.email,
              avatar_url: user.avatar_url,
              avatar_seed: user.avatar_seed,
            }}
            size="md"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* User info header */}
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-slate-900 truncate">
            {user.full_name || 'User'}
          </p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />

        {/* Account Settings */}
        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>

        {/* Workshop */}
        <DropdownMenuItem asChild>
          <Link href="/workshop" className="cursor-pointer">
            <Wrench className="mr-2 h-4 w-4" />
            Workshop
          </Link>
        </DropdownMenuItem>

        {/* Admin link for staff/admin */}
        {isAdminOrStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Sign out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
