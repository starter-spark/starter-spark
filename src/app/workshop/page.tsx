import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Package, Key, Award, LogIn } from "lucide-react"
import Link from "next/link"
import { ClaimCodeForm } from "./ClaimCodeForm"
import { KitCard } from "./KitCard"
import { QuickTools } from "./QuickTools"

export default async function WorkshopPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If logged in, fetch user's licenses with product info
  let licenses: Array<{
    id: string
    code: string
    created_at: string | null
    product: {
      slug: string
      name: string
      description: string | null
    } | null
  }> = []

  if (user) {
    const { data } = await supabase
      .from("licenses")
      .select(
        `
        id,
        code,
        created_at,
        product:products(slug, name, description)
      `
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })

    if (data) {
      licenses = data as typeof licenses
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-mono text-cyan-700 mb-2">Dashboard</p>
          <h1 className="font-mono text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Workshop
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            {user
              ? "Manage your kits, track progress, and access learning materials."
              : "Sign in to access your kits and learning materials."}
          </p>
        </div>
      </section>

      {!user ? (
        /* Not Logged In State */
        <section className="pb-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                <LogIn className="w-10 h-10 text-slate-500" />
              </div>
              <h2 className="font-mono text-2xl text-slate-900 mb-2">
                Sign In Required
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Sign in to view your kits, track your learning progress, and
                claim new kit codes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button
                    variant="outline"
                    className="border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Shop Kits
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Logged In State */
        <section className="pb-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column - My Kits (70%) */}
              <div className="w-full lg:w-[70%]">
                <div className="bg-white rounded border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-mono text-xl text-slate-900">
                      My Kits
                    </h2>
                    <span className="text-sm text-slate-500 font-mono">
                      {licenses.length}{" "}
                      {licenses.length === 1 ? "kit" : "kits"}
                    </span>
                  </div>

                  {licenses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-600 mb-4">
                        You don&apos;t have any kits yet.
                      </p>
                      <p className="text-sm text-slate-500 mb-6">
                        Purchase a kit or enter a code to get started.
                      </p>
                      <Link href="/shop">
                        <Button className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                          Browse Kits
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {licenses.map((license) => (
                        <KitCard
                          key={license.id}
                          name={license.product?.name || "Unknown Kit"}
                          slug={license.product?.slug || ""}
                          description={license.product?.description || ""}
                          claimedAt={license.created_at}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Tools & Actions (30%) */}
              <div className="w-full lg:w-[30%] space-y-6">
                {/* Claim a Kit */}
                <div className="bg-white rounded border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-cyan-700" />
                    <h3 className="font-mono text-lg text-slate-900">
                      Claim a Kit
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Have a kit code? Enter it below to activate your kit.
                  </p>
                  <ClaimCodeForm />
                </div>

                {/* Quick Tools */}
                <QuickTools />

                {/* Achievements Preview */}
                <div className="bg-white rounded border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-mono text-lg text-slate-900">
                      Achievements
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {/* Placeholder badges */}
                    {["First Build", "Wiring Pro", "Code Ninja", "Helper"].map(
                      (badge, i) => (
                        <div
                          key={badge}
                          className={`aspect-square rounded border flex items-center justify-center ${
                            i === 0
                              ? "border-amber-300 bg-amber-50"
                              : "border-slate-200 bg-slate-50 opacity-40"
                          }`}
                          title={badge}
                        >
                          <Award
                            className={`w-6 h-6 ${
                              i === 0 ? "text-amber-500" : "text-slate-500"
                            }`}
                          />
                        </div>
                      )
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 text-center">
                    Complete lessons to unlock badges
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
