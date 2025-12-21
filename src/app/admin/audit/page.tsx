import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { AuditLogTable } from "./AuditLogTable"

export const metadata = {
  title: "Audit Log | Admin",
  description: "Track all admin actions and changes",
}

async function getAuditLogs(searchParams: {
  page?: string
  resource?: string
  action?: string
  user?: string
}) {
  // Defense-in-depth: verify admin/staff before using service role.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { logs: [], count: 0, userEmails: {} }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    return { logs: [], count: 0, userEmails: {} }
  }

  const page = Number.parseInt(searchParams.page || "1")
  const limit = 25
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.resource && searchParams.resource !== "all") {
    query = query.eq("resource_type", searchParams.resource)
  }

  if (searchParams.action && searchParams.action !== "all") {
    query = query.eq("action", searchParams.action)
  }

  const { data: logs, count, error } = await query

  if (error) {
    console.error("Failed to fetch audit logs:", error)
    return { logs: [], count: 0, userEmails: {} }
  }

  // Fetch user emails for all user_ids
  const userIds = [...new Set(logs?.map((l) => l.user_id).filter((id): id is string => id !== null))]
  const userEmails: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .in("id", userIds)

    if (profiles) for (const p of profiles) {
      if (p.id && p.email) {
        userEmails[p.id] = p.email
      }
    }
  }

  return { logs: logs || [], count: count || 0, userEmails }
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    resource?: string
    action?: string
    user?: string
  }>
}) {
  const params = await searchParams
  const { logs, count, userEmails } = await getAuditLogs(params)
  const currentPage = Number.parseInt(params.page || "1")
  const totalPages = Math.ceil(count / 25)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-bold text-slate-900">Audit Log</h1>
        <p className="text-slate-600 mt-1">
          Complete history of all admin actions. {count} total entries.
        </p>
      </div>

      <AuditLogTable
        logs={logs}
        userEmails={userEmails}
        currentPage={currentPage}
        totalPages={totalPages}
        filters={{
          resource: params.resource || "all",
          action: params.action || "all",
        }}
      />
    </div>
  )
}
