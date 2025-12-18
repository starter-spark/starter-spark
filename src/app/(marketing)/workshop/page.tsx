import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Package, Key, LogIn } from "lucide-react"
import Link from "next/link"
import { ClaimCodeForm } from "./ClaimCodeForm"
import { KitCard } from "./KitCard"
import { QuickTools } from "./QuickTools"
import { AchievementsPanel } from "./AchievementsPanel"
import { getContents } from "@/lib/content"
import { getUserAchievements } from "@/lib/achievements"

export default async function WorkshopPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch dynamic content
  const content = await getContents(
    [
      "workshop.header.title",
      "workshop.header.description",
      "workshop.header.description_signed_out",
      "workshop.no_kits",
      "workshop.signIn.title",
      "workshop.signIn.description",
      "workshop.signIn.button",
      "workshop.signIn.shopButton",
      "workshop.kits.title",
      "workshop.kits.empty.subtitle",
      "workshop.kits.empty.cta",
      "workshop.claim.title",
      "workshop.claim.description",
      "workshop.achievements.title",
      "workshop.achievements.hint",
    ],
    {
      "workshop.header.title": "Workshop",
      "workshop.header.description": "Manage your kits, track progress, and access learning materials.",
      "workshop.header.description_signed_out": "Sign in to access your kits and learning materials.",
      "workshop.no_kits": "You don't have any kits yet.",
      "workshop.signIn.title": "Sign In Required",
      "workshop.signIn.description": "Sign in to view your kits, track your learning progress, and claim new kit codes.",
      "workshop.signIn.button": "Sign In",
      "workshop.signIn.shopButton": "Shop Kits",
      "workshop.kits.title": "My Kits",
      "workshop.kits.empty.subtitle": "Purchase a kit or enter a code to get started.",
      "workshop.kits.empty.cta": "Browse Kits",
      "workshop.claim.title": "Claim a Kit",
      "workshop.claim.description": "Have a kit code? Enter it below to activate your kit.",
      "workshop.achievements.title": "Achievements",
      "workshop.achievements.hint": "Complete lessons to unlock badges",
    }
  )

  // If logged in, fetch user's licenses with product info
  let groupedKits: Array<{
    slug: string
    name: string
    description: string | null
    quantity: number
    claimedAt: string | null
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
      // Group licenses by product slug
      const kitMap = new Map<string, {
        slug: string
        name: string
        description: string | null
        quantity: number
        claimedAt: string | null
      }>()

      for (const license of data) {
        const product = license.product as unknown as { slug: string; name: string; description: string | null } | null
        if (!product) continue

        const existing = kitMap.get(product.slug)
        if (existing) {
          existing.quantity++
          // Keep the earliest claimed date
          if (license.created_at && (!existing.claimedAt || license.created_at < existing.claimedAt)) {
            existing.claimedAt = license.created_at
          }
        } else {
          kitMap.set(product.slug, {
            slug: product.slug,
            name: product.name,
            description: product.description,
            quantity: 1,
            claimedAt: license.created_at,
          })
        }
      }

      groupedKits = Array.from(kitMap.values())
    }
  }

  // Total license count for display
  const totalLicenses = groupedKits.reduce((sum, kit) => sum + kit.quantity, 0)

  // Fetch achievements for logged in user
  const achievementData = user
    ? await getUserAchievements(user.id)
    : { achievements: [], userAchievements: [], totalPoints: 0 }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-mono text-cyan-700 mb-2">Dashboard</p>
          <h1 className="font-mono text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            {content["workshop.header.title"]}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            {user
              ? content["workshop.header.description"]
              : content["workshop.header.description_signed_out"]}
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
                {content["workshop.signIn.title"]}
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {content["workshop.signIn.description"]}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                    <LogIn className="w-4 h-4 mr-2" />
                    {content["workshop.signIn.button"]}
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button
                    variant="outline"
                    className="border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {content["workshop.signIn.shopButton"]}
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
                      {content["workshop.kits.title"]}
                    </h2>
                    <span className="text-sm text-slate-500 font-mono">
                      {totalLicenses}{" "}
                      {totalLicenses === 1 ? "license" : "licenses"}
                      {groupedKits.length !== totalLicenses && (
                        <span className="text-slate-400"> ({groupedKits.length} {groupedKits.length === 1 ? "kit" : "kits"})</span>
                      )}
                    </span>
                  </div>

                  {groupedKits.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-600 mb-4">
                        {content["workshop.no_kits"]}
                      </p>
                      <p className="text-sm text-slate-500 mb-6">
                        {content["workshop.kits.empty.subtitle"]}
                      </p>
                      <Link href="/shop">
                        <Button className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono">
                          {content["workshop.kits.empty.cta"]}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {groupedKits.map((kit) => (
                        <KitCard
                          key={kit.slug}
                          name={kit.name}
                          slug={kit.slug}
                          description={kit.description || ""}
                          claimedAt={kit.claimedAt}
                          quantity={kit.quantity}
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
                      {content["workshop.claim.title"]}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    {content["workshop.claim.description"]}
                  </p>
                  <ClaimCodeForm />
                </div>

                {/* Quick Tools */}
                <QuickTools />

                {/* Achievements */}
                <AchievementsPanel
                  achievements={achievementData.achievements}
                  userAchievements={achievementData.userAchievements}
                  totalPoints={achievementData.totalPoints}
                  title={content["workshop.achievements.title"]}
                  hint={content["workshop.achievements.hint"]}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
