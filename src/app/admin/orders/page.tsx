import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { UrlPagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreditCard } from 'lucide-react'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export const metadata = {
  title: 'Orders | Admin',
}

const ITEMS_PER_PAGE = 50

async function getOrders(page: number = 1) {
  const supabase = await createClient()

  // Get total count
  const { count } = await supabase
    .from('licenses')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'online_purchase')
  const totalCount = count || 0

  // Orders are licenses with source = 'online_purchase'
  const offset = (page - 1) * ITEMS_PER_PAGE
  const { data, error } = await supabase
    .from('licenses')
    .select(
      `
      *,
      products(name, price_cents),
      profiles(id, email, full_name, avatar_url, avatar_seed)
    `,
    )
    .eq('source', 'online_purchase')
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching orders:', error)
    return { data: [], totalCount: 0 }
  }

  return { data: data || [], totalCount }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: MaybePromise<{ page?: string }>
}) {
  const params = await resolveParams(searchParams)
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const { data: orders, totalCount } = await getOrders(currentPage)
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Calculate stats
  const totalOrders = orders.length
  const claimedOrders = orders.filter((o) => o.owner_id !== null).length
  const totalRevenue = orders.reduce((sum, order) => {
    const product = order.products as unknown as {
      name: string
      price_cents: number
    } | null
    return sum + (product?.price_cents || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-600">
          Online purchases and license fulfillment
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Total Orders</p>
          <p className="font-mono text-2xl font-bold text-slate-900">
            {totalOrders}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Claimed</p>
          <p className="font-mono text-2xl font-bold text-green-600">
            {claimedOrders}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Total Revenue</p>
          <p className="font-mono text-2xl font-bold text-cyan-700">
            ${(totalRevenue / 100).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">No online orders yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Date</TableHead>
                <TableHead className="hidden sm:table-cell">
                  License Code
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const product = order.products as unknown as {
                  name: string
                  price_cents: number
                } | null
                const owner = order.profiles as unknown as {
                  id: string
                  email: string
                  full_name: string | null
                  avatar_url: string | null
                  avatar_seed: string | null
                } | null

                const priceDollars = (
                  (product?.price_cents || 0) / 100
                ).toFixed(2)
                const mobileCode =
                  order.code.length > 12
                    ? `${order.code.slice(0, 4)}…${order.code.slice(-4)}`
                    : order.code

                return (
                  <TableRow key={order.id}>
                    <TableCell className="text-sm text-slate-500">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">
                        {order.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-slate-900">
                      <div className="min-w-0">
                        <p className="truncate">{product?.name || 'Unknown'}</p>
                        <p className="mt-1 text-xs text-slate-500 sm:hidden">
                          <span className="font-mono">{mobileCode}</span>
                          <span className="mx-1">•</span>
                          <span className="font-mono">${priceDollars}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm text-slate-900">
                      ${priceDollars}
                    </TableCell>
                    <TableCell>
                      {owner ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <UserAvatar
                            user={{
                              id: owner.id,
                              full_name: owner.full_name,
                              email: owner.email,
                              avatar_url: owner.avatar_url,
                              avatar_seed: owner.avatar_seed,
                            }}
                            size="sm"
                          />
                          <span className="min-w-0 truncate text-sm text-slate-900">
                            {owner.full_name || owner.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Unclaimed
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.owner_id ? (
                        <Badge className="bg-green-100 text-green-700">
                          Fulfilled
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-amber-600"
                        >
                          Pending Claim
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200">
              <UrlPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                baseUrl="/admin/orders"
                showItemCount
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
