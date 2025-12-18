import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CreditCard, User } from "lucide-react"

export const metadata = {
  title: "Orders | Admin",
}

async function getOrders() {
  const supabase = await createClient()

  // Orders are licenses with source = 'online_purchase'
  const { data, error } = await supabase
    .from("licenses")
    .select(`
      *,
      products(name, price_cents),
      profiles(email, full_name)
    `)
    .eq("source", "online_purchase")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }

  return data
}

export default async function OrdersPage() {
  const orders = await getOrders()

  // Calculate stats
  const totalOrders = orders.length
  const claimedOrders = orders.filter((o) => o.owner_id !== null).length
  const totalRevenue = orders.reduce((sum, order) => {
    const product = order.products as unknown as { name: string; price_cents: number } | null
    return sum + (product?.price_cents || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-600">Online purchases and license fulfillment</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Total Orders</p>
          <p className="font-mono text-2xl font-bold text-slate-900">{totalOrders}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">Claimed</p>
          <p className="font-mono text-2xl font-bold text-green-600">{claimedOrders}</p>
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
                <TableHead>License Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const product = order.products as unknown as { name: string; price_cents: number } | null
                const owner = order.profiles as unknown as { email: string; full_name: string | null } | null

                return (
                  <TableRow key={order.id}>
                    <TableCell className="text-sm text-slate-500">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">
                        {order.code}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-slate-900">
                      {product?.name || "Unknown"}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-900">
                      ${((product?.price_cents || 0) / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {owner ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {owner.full_name || owner.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Unclaimed</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.owner_id ? (
                        <Badge className="bg-green-100 text-green-700">Fulfilled</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-300 text-amber-600">
                          Pending Claim
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
