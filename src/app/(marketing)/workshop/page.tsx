import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Package, Key, LogIn, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ClaimCodeForm } from './ClaimCodeForm'
import { KitCard } from './KitCard'
import { PendingLicenseCard } from './PendingLicenseCard'
import { ClaimedByOtherCard } from './ClaimedByOtherCard'
import { getContents } from '@/lib/content'
import { getUserAchievements } from '@/lib/achievements'
import { WorkshopTabs } from './WorkshopTabs'
import { CoursesTab } from './CoursesTab'
import { ToolsTab } from './ToolsTab'
import { ProgressTab } from './ProgressTab'
import { SkillAssessmentWrapper } from '../learn/SkillAssessmentWrapper'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

interface CourseModule {
  id: string
  title: string
  is_published: boolean | null
  lessons:
    | {
        id: string
        is_optional: boolean | null
        is_published: boolean | null
      }[]
    | null
}

interface Course {
  id: string
  title: string
  description: string | null
  difficulty: string
  duration_minutes: number
  is_published: boolean | null
  product: {
    id: string
    slug: string
    name: string
  } | null
  modules: CourseModule[]
}

export default async function WorkshopPage({
  searchParams,
}: {
  searchParams: MaybePromise<{ tab?: string; difficulty?: string }>
}) {
  const { difficulty: difficultyFilter } = await resolveParams(searchParams)
  const supabase = await createClient()

  let user: { id: string } | null = null
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser()
    user = fetchedUser ?? null
  } catch (error) {
    console.error('Failed to fetch user:', error)
    user = null
  }

  // Fetch dynamic content
  const content = await getContents(
    [
      'workshop.header.title',
      'workshop.header.description',
      'workshop.header.description_signed_out',
      'workshop.no_kits',
      'workshop.signIn.title',
      'workshop.signIn.description',
      'workshop.signIn.button',
      'workshop.signIn.shopButton',
      'workshop.kits.title',
      'workshop.kits.empty.subtitle',
      'workshop.kits.empty.cta',
      'workshop.claim.title',
      'workshop.claim.description',
      'workshop.pending.title',
      'workshop.pending.description',
      'learn.empty',
    ],
    {
      'workshop.header.title': 'Workshop',
      'workshop.header.description':
        'Your learning hub - courses, tools, and progress all in one place.',
      'workshop.header.description_signed_out':
        'Sign in to access your kits and learning materials.',
      'workshop.no_kits': "You don't have any kits yet.",
      'workshop.signIn.title': 'Sign In Required',
      'workshop.signIn.description':
        'Sign in to view your kits, track your learning progress, and claim new kit codes.',
      'workshop.signIn.button': 'Sign In',
      'workshop.signIn.shopButton': 'Shop Kits',
      'workshop.kits.title': 'My Kits',
      'workshop.kits.empty.subtitle':
        'Purchase a kit or enter a code to get started.',
      'workshop.kits.empty.cta': 'Browse Kits',
      'workshop.claim.title': 'Claim a Kit',
      'workshop.claim.description':
        'Have a kit code? Enter it below to activate your kit.',
      'workshop.pending.title': 'Pending Licenses',
      'workshop.pending.description':
        "These licenses were purchased with your email. Claim to add to your account or reject if you didn't make this purchase.",
      'learn.empty': 'No courses available yet. Check back soon.',
    },
  )

  // Data: kits
  let groupedKits: {
    slug: string
    name: string
    description: string | null
    quantity: number
    claimedAt: string | null
  }[] = []

  let pendingLicenses: {
    id: string
    code: string
    productName: string
    productSlug: string
    productDescription: string | null
    purchasedAt: string
  }[] = []

  let claimedByOtherLicenses: {
    code: string
    productName: string
    purchasedAt: string
  }[] = []

  const ownedProductIds: string[] = []
  let completedLessonIds: string[] = []

  if (user && supabase) {
    // Fetch claimed licenses
    const { data: claimedData } = await supabase
      .from('licenses')
      .select(
        `
        id,
        code,
        created_at,
        product:products(id, slug, name, description)
      `,
      )
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (claimedData) {
      const kitMap = new Map<
        string,
        {
          slug: string
          name: string
          description: string | null
          quantity: number
          claimedAt: string | null
        }
      >()

      for (const license of claimedData) {
        const product = license.product as unknown as {
          id: string
          slug: string
          name: string
          description: string | null
        } | null
        if (!product) continue

        ownedProductIds.push(product.id)

        const existing = kitMap.get(product.slug)
        if (existing) {
          existing.quantity++
          if (
            license.created_at &&
            (!existing.claimedAt || license.created_at < existing.claimedAt)
          ) {
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

    // Fetch pending licenses
    const { data: pendingData } = await supabase
      .from('licenses')
      .select(
        `
        id,
        code,
        created_at,
        product:products(slug, name, description)
      `,
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (pendingData) {
      pendingLicenses = pendingData.map((license) => {
        const product = license.product as unknown as {
          slug: string
          name: string
          description: string | null
        } | null
        return {
          id: license.id,
          code: license.code,
          productName: product?.name || 'Unknown Kit',
          productSlug: product?.slug || '',
          productDescription: product?.description || null,
          purchasedAt: license.created_at || new Date().toISOString(),
        }
      })
    }

    // Fetch claimed by other licenses
    const { data: claimedByOtherData } = await supabase
      .from('licenses')
      .select(
        `
        code,
        created_at,
        product:products(name)
      `,
      )
      .eq('status', 'claimed_by_other')
      .order('created_at', { ascending: false })

    if (claimedByOtherData) {
      claimedByOtherLicenses = claimedByOtherData.map((license) => {
        const product = license.product as unknown as { name: string } | null
        return {
          code: license.code,
          productName: product?.name || 'Unknown Kit',
          purchasedAt: license.created_at || new Date().toISOString(),
        }
      })
    }

    // Fetch completed lessons
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)

    if (progress) {
      completedLessonIds = progress.map((p) => p.lesson_id)
    }
  }

  // Data: courses
  let courses: Course[] = []
  if (supabase && user) {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select(
          `
          id,
          title,
          description,
          difficulty,
          duration_minutes,
          is_published,
          product:products (
            id,
            slug,
            name
          ),
          modules (
            id,
            title,
            is_published,
            lessons (id, is_optional, is_published)
          )
        `,
        )
        .eq('is_published', true)
        .order('created_at', { ascending: true })

      // Filter courses by difficulty if specified
      courses =
        difficultyFilter && difficultyFilter !== 'all'
          ? ((coursesData ?? []) as unknown as Course[]).filter(
              (c) => c.difficulty === difficultyFilter,
            )
          : ((coursesData ?? []) as unknown as Course[])
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  // Data: stats
  let learningStats = { xp: 0, level: 1, streakDays: 0 }
  let lessonsCompleted = 0
  let hasSkillLevel = false

  if (user && supabase) {
    const { data: statsData } = await supabase
      .from('user_learning_stats')
      .select('xp, level, streak_days')
      .eq('user_id', user.id)
      .maybeSingle()

    if (statsData) {
      learningStats = {
        xp: statsData.xp,
        level: statsData.level,
        streakDays: statsData.streak_days,
      }
    }

    // Count completed lessons
    const { count } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)

    lessonsCompleted = count ?? 0

    // Check if user has set skill level
    const { data: profileData } = await supabase
      .from('profiles')
      .select('skill_level')
      .eq('id', user.id)
      .maybeSingle()

    hasSkillLevel = !!profileData?.skill_level
  }

  // Data: achievements
  const achievementData = user
    ? await getUserAchievements(user.id)
    : { achievements: [], userAchievements: [], totalPoints: 0 }

  // Data: leaderboard
  let leaderboardEntries: {
    rank: number
    displayName: string
    xp: number
    level: number
    isCurrentUser: boolean
  }[] = []
  let currentUserRank: number | null = null

  if (supabase && user) {
    try {
      const { data: leaderboardData } = await supabase
        .from('user_learning_stats')
        .select('user_id, xp, level')
        .order('xp', { ascending: false })
        .limit(10)

      leaderboardEntries = (leaderboardData ?? []).map((entry, index) => ({
        rank: index + 1,
        displayName: `Learner ${entry.user_id.slice(0, 4).toUpperCase()}`,
        xp: entry.xp,
        level: entry.level,
        isCurrentUser: user?.id === entry.user_id,
      }))

      if (!leaderboardEntries.some((e) => e.isCurrentUser)) {
        const { count } = await supabase
          .from('user_learning_stats')
          .select('*', { count: 'exact', head: true })
          .gt('xp', learningStats.xp)

        currentUserRank = (count ?? 0) + 1
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    }
  }

  // Total licenses (display)
  const totalLicenses = groupedKits.reduce((sum, kit) => sum + kit.quantity, 0)

  // Render
  const pageContent = (
    <div className="bg-slate-50">
      {/* Header */}
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-mono text-cyan-700 mb-2">Dashboard</p>
          <h1 className="font-mono text-4xl lg:text-5xl font-bold text-slate-900 mb-4 break-words">
            {content['workshop.header.title']}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl break-words">
            {user
              ? content['workshop.header.description']
              : content['workshop.header.description_signed_out']}
          </p>
        </div>
      </section>

      {user ? (
        /* Logged In State */
        <section className="pb-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left column (70%) */}
              <div className="w-full lg:w-[70%] space-y-6">
                {/* Pending Licenses Alert */}
                {(pendingLicenses.length > 0 ||
                  claimedByOtherLicenses.length > 0) && (
                  <div className="bg-amber-50 rounded border border-amber-200 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <h2 className="font-mono text-xl text-slate-900">
                        {content['workshop.pending.title']}
                      </h2>
                      {pendingLicenses.length > 0 && (
                        <span className="text-sm font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          {pendingLicenses.length} pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      {content['workshop.pending.description']}
                    </p>
                    <div className="space-y-3">
                      {pendingLicenses.map((license) => (
                        <PendingLicenseCard
                          key={license.id}
                          licenseId={license.id}
                          code={license.code}
                          productName={license.productName}
                          productDescription={license.productDescription}
                          purchasedAt={license.purchasedAt}
                        />
                      ))}
                      {claimedByOtherLicenses.map((license) => (
                        <ClaimedByOtherCard
                          key={license.code}
                          code={license.code}
                          productName={license.productName}
                          purchasedAt={license.purchasedAt}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabbed Content */}
                <div className="bg-white rounded border border-slate-200 p-6">
                  <WorkshopTabs
                    coursesContent={
                      <CoursesTab
                        courses={courses}
                        ownedProductIds={ownedProductIds}
                        completedLessonIds={completedLessonIds}
                        learningStats={learningStats}
                        isLoggedIn={!!user}
                        userId={user.id}
                        emptyMessage={content['learn.empty']}
                      />
                    }
                    toolsContent={<ToolsTab />}
                    progressContent={
                      <ProgressTab
                        learningStats={learningStats}
                        lessonsCompleted={lessonsCompleted}
                        achievements={achievementData.achievements}
                        userAchievements={achievementData.userAchievements}
                        totalPoints={achievementData.totalPoints}
                        leaderboardEntries={leaderboardEntries}
                        currentUserRank={currentUserRank}
                        isLoggedIn={!!user}
                      />
                    }
                  />
                </div>
              </div>

              {/* Right column (30%) */}
              <div className="w-full lg:w-[30%] space-y-6">
                {/* My Kits */}
                <div className="bg-white rounded border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-mono text-lg text-slate-900">
                      {content['workshop.kits.title']}
                    </h2>
                    <span className="text-xs text-slate-500 font-mono">
                      {totalLicenses}{' '}
                      {totalLicenses === 1 ? 'license' : 'licenses'}
                    </span>
                  </div>

                  {groupedKits.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        {content['workshop.no_kits']}
                      </p>
                      <p className="text-xs text-slate-500 mb-4">
                        {content['workshop.kits.empty.subtitle']}
                      </p>
                      <Button
                        asChild
                        size="sm"
                        className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
                      >
                        <Link href="/shop">
                          {content['workshop.kits.empty.cta']}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedKits.map((kit) => (
                        <KitCard
                          key={kit.slug}
                          name={kit.name}
                          slug={kit.slug}
                          description={kit.description || ''}
                          claimedAt={kit.claimedAt}
                          quantity={kit.quantity}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Claim a Kit */}
                <div className="bg-white rounded border border-slate-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-cyan-700" />
                    <h3 className="font-mono text-lg text-slate-900">
                      {content['workshop.claim.title']}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    {content['workshop.claim.description']}
                  </p>
                  <ClaimCodeForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Not Logged In State */
        <section className="pb-24 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                <LogIn className="w-10 h-10 text-slate-500" />
              </div>
              <h2 className="font-mono text-2xl text-slate-900 mb-2">
                {content['workshop.signIn.title']}
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {content['workshop.signIn.description']}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
                >
                  <Link href="/login">
                    <LogIn className="w-4 h-4 mr-2" />
                    {content['workshop.signIn.button']}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono"
                >
                  <Link href="/shop">
                    <Package className="w-4 h-4 mr-2" />
                    {content['workshop.signIn.shopButton']}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )

  // Show skill assessment for logged-in users who haven't set their skill level
  if (user && !hasSkillLevel) {
    return (
      <SkillAssessmentWrapper userId={user.id} hasSkillLevel={hasSkillLevel}>
        {pageContent}
      </SkillAssessmentWrapper>
    )
  }

  return pageContent
}
