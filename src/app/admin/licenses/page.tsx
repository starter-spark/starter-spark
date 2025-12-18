import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, User } from "lucide-react"
import { LicenseActions } from "./LicenseActions"
import { ProductFilterClient } from "./ProductFilterClient"

export const metadata = {
  title: "Licenses | Admin",
}

interface SearchParams {
  filter?: string
  product?: string
}

async function getLicenses(filter?: string, productId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("licenses")
    .select(`
      *,
      products(name, slug),
      profiles(email, full_name)
    `)
    .order("created_at", { ascending: false })

  if (filter === "unclaimed") {
    query = query.is("owner_id", null)
  } else if (filter === "claimed") {
    query = query.not("owner_id", "is", null)
  }

  if (productId) {
    query = query.eq("product_id", productId)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error("Error fetching licenses:", error)
    return []
  }

  return data
}

async function getProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("products")
    .select("id, name")
    .order("name")

  return data ?? []
}

export default async function LicensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [licenses, products] = await Promise.all([
    getLicenses(params.filter, params.product),
    getProducts(),
  ])

  const filters = [
    { label: "All", value: undefined },
    { label: "Unclaimed", value: "unclaimed" },
    { label: "Claimed", value: "claimed" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-slate-900">Licenses</h1>
          <p className="text-slate-600">Manage license codes and assignments</p>
        </div>
        <Link href="/admin/licenses/generate">
          <Button className="bg-cyan-700 hover:bg-cyan-600">
            <Plus className="mr-2 h-4 w-4" />
            Generate Licenses
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {filters.map((filter) => {
            // Preserve product filter when changing status filter
            const href = filter.value
              ? `/admin/licenses?filter=${filter.value}${params.product ? `&product=${params.product}` : ""}`
              : params.product
                ? `/admin/licenses?product=${params.product}`
                : "/admin/licenses"
            return (
              <Link key={filter.label} href={href}>
                <Button
                  variant={params.filter === filter.value ? "default" : "outline"}
                  size="sm"
                  className={
                    params.filter === filter.value
                      ? "bg-cyan-700 hover:bg-cyan-600"
                      : ""
                  }
                >
                  {filter.label}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Product Filter */}
        <ProductFilterClient
          products={products}
          currentProduct={params.product}
          currentFilter={params.filter}
        />
      </div>

      {/* Licenses Table */}
      {licenses.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">No licenses found.</p>
          <Link href="/admin/licenses/generate">
            <Button className="mt-4 bg-cyan-700 hover:bg-cyan-600">
              Generate licenses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => {
                const product = license.products as unknown as { name: string; slug: string } | null
                const owner = license.profiles as unknown as { email: string; full_name: string | null } | null

                return (
                  <TableRow key={license.id}>
                    <TableCell>
                      <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">
                        {license.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-900">
                        {product?.name || "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {owner ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-900">
                              {owner.full_name || owner.email}
                            </p>
                            {owner.full_name && (
                              <p className="text-xs text-slate-500">{owner.email}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Unclaimed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          license.source === "online_purchase"
                            ? "text-cyan-700 border-cyan-300"
                            : "text-purple-700 border-purple-300"
                        }
                      >
                        {license.source === "online_purchase" ? "Online" : "Physical"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {license.created_at ? new Date(license.created_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <LicenseActions
                        licenseId={license.id}
                        isClaimed={!!license.owner_id}
                      />
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
