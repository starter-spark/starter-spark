import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export const metadata = {
  title: "Admin Dashboard",
  description: "StarterSpark Admin Dashboard",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get("x-nonce") ?? ""
  const supabase = await createClient()

  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login?redirect=/admin")
  }

  // Get profile with role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Admin layout profile fetch failed:", profileError)
    throw new Error("Failed to load admin profile")
  }

  if (!profile) {
    redirect("/?error=no_profile")
  }

  // Check admin or staff role
  if (profile.role !== "admin" && profile.role !== "staff") {
    redirect("/?error=unauthorized")
  }

  return (
    <div className="admin-layout flex h-screen min-h-0 bg-slate-50" data-csp-nonce={nonce || undefined}>
      <AdminSidebar
        user={{
          email: user.email || "",
          name: profile.full_name,
          role: profile.role,
        }}
      />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
