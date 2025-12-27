import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Shield, UserCog, Ban } from 'lucide-react'
import { UserActions } from './UserActions'
import { UserAvatar } from '@/components/ui/user-avatar'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export const metadata = {
  title: 'Users | Admin',
}

interface SearchParams {
  role?: string
  banned?: string
}

type UserRole = 'admin' | 'staff' | 'user'

async function getUsers(role?: string, showBanned?: boolean) {
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select(
      'id, email, full_name, avatar_url, avatar_seed, role, created_at, is_banned_from_forums, banned_at, ban_reason',
    )
    .order('created_at', { ascending: false })

  if (role && role !== 'all' && ['admin', 'staff', 'user'].includes(role)) {
    query = query.eq('role', role as UserRole)
  }

  if (showBanned) {
    query = query.eq('is_banned_from_forums', true)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return data
}

async function getUserStats() {
  const supabase = await createClient()

  const [totalResult, adminResult, staffResult, bannedResult] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'staff'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_banned_from_forums', true),
    ])

  return {
    total: totalResult.count || 0,
    admins: adminResult.count || 0,
    staff: staffResult.count || 0,
    banned: bannedResult.count || 0,
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: MaybePromise<SearchParams>
}) {
  const params = await resolveParams(searchParams)
  const showBanned = params.banned === 'true'
  const [users, stats] = await Promise.all([
    getUsers(params.role, showBanned),
    getUserStats(),
  ])

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Users', value: 'user' },
    { label: 'Staff', value: 'staff' },
    { label: 'Admins', value: 'admin' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-600">Manage user accounts and roles</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Total Users</p>
          <p className="font-mono text-2xl font-bold text-slate-900">
            {stats.total}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Staff Members</p>
          <p className="font-mono text-2xl font-bold text-cyan-700">
            {stats.staff}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Administrators</p>
          <p className="font-mono text-2xl font-bold text-purple-700">
            {stats.admins}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Banned Users</p>
          <p className="font-mono text-2xl font-bold text-red-600">
            {stats.banned}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const href =
            filter.value === 'all'
              ? '/admin/users'
              : `/admin/users?role=${filter.value}`
          const selected =
            !showBanned &&
            (params.role === filter.value ||
              (!params.role && filter.value === 'all'))
          return (
            <Button
              key={filter.value}
              asChild
              variant={selected ? 'default' : 'outline'}
              size="sm"
              className={selected ? 'bg-cyan-700 hover:bg-cyan-600' : ''}
            >
              <Link href={href}>{filter.label}</Link>
            </Button>
          )
        })}
        <Button
          asChild
          variant={showBanned ? 'default' : 'outline'}
          size="sm"
          className={
            showBanned
              ? 'bg-red-600 hover:bg-red-500'
              : 'border-red-200 text-red-600 hover:bg-red-50'
          }
        >
          <Link href="/admin/users?banned=true">
            <Ban className="mr-1 h-3 w-3" />
            Banned
          </Link>
        </Button>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">
            {showBanned ? 'No banned users.' : 'No users found.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.is_banned_from_forums ? 'bg-red-50/50' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
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
                      <span className="font-medium text-slate-900">
                        {user.full_name || 'No name'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.role === 'admin'
                          ? 'border-purple-300 text-purple-700'
                          : user.role === 'staff'
                            ? 'border-cyan-300 text-cyan-700'
                            : 'border-slate-300 text-slate-700'
                      }
                    >
                      {user.role === 'admin' && (
                        <Shield className="mr-1 h-3 w-3" />
                      )}
                      {user.role === 'staff' && (
                        <UserCog className="mr-1 h-3 w-3" />
                      )}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_banned_from_forums ? (
                      <Badge
                        variant="outline"
                        className="border-red-300 bg-red-50 text-red-700"
                      >
                        <Ban className="mr-1 h-3 w-3" />
                        Banned
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-green-300 text-green-700"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <UserActions
                      userId={user.id}
                      currentRole={user.role}
                      isBanned={user.is_banned_from_forums}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
