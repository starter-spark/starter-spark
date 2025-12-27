import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CartSheet } from '@/components/commerce'
import { SiteBanner } from '@/components/layout/SiteBanner'
import { createClient } from '@/lib/supabase/server'
import { Skeleton } from '@/components/ui/skeleton'

async function getUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Profile (avatar, role)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, avatar_seed, role')
    .eq('id', user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email || '',
    full_name: profile?.full_name || null,
    avatar_url: profile?.avatar_url || null,
    avatar_seed: profile?.avatar_seed || null,
    role: profile?.role || null,
  }
}

async function HeaderWithUser() {
  const user = await getUser()
  return <Header user={user} />
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="flex items-center justify-between h-16">
          {/* Logo skeleton */}
          <Skeleton className="h-6 w-32 bg-slate-200" />
          {/* Nav skeleton (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Skeleton className="h-4 w-20 bg-slate-100" />
            <Skeleton className="h-4 w-20 bg-slate-100" />
            <Skeleton className="h-4 w-16 bg-slate-100" />
          </div>
          {/* Actions skeleton */}
          <div className="hidden md:flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md bg-slate-100" />
            <Skeleton className="h-9 w-24 rounded-md bg-cyan-100" />
            <Skeleton className="h-9 w-9 rounded-full bg-slate-200" />
          </div>
          {/* Mobile menu skeleton */}
          <div className="flex md:hidden items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full bg-slate-200" />
            <Skeleton className="h-9 w-9 rounded-md bg-slate-100" />
            <Skeleton className="h-6 w-6 bg-slate-100" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip link (hidden until focus) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cyan-700 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <SiteBanner />
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderWithUser />
      </Suspense>
      <main
        id="main-content"
        tabIndex={-1}
        className="outline-none flex-1 bg-slate-50"
      >
        {children}
      </main>
      <Footer />
      <CartSheet />
    </div>
  )
}
