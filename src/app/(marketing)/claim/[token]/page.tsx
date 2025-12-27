import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import {
  Package,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  LogIn,
} from 'lucide-react'
import Link from 'next/link'
import { ClaimButton } from './ClaimButton'
import { isValidClaimToken } from '@/lib/validation'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export const metadata = {
  title: 'Claim Your Kit - StarterSpark Robotics',
  description: 'Claim your StarterSpark robotics kit license.',
}

interface ClaimPageProps {
  params: MaybePromise<{ token: string }>
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { token } = await resolveParams(params)

  if (!isValidClaimToken(token)) {
    return <InvalidClaimLink />
  }

  // Look up the license by claim token
  const { data: license, error } = await supabaseAdmin
    .from('licenses')
    .select(
      `
      id,
      code,
      owner_id,
      product:products(name, slug, description)
    `,
    )
    .eq('claim_token', token)
    .maybeSingle()

  // Check if user is logged in
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Invalid or missing token
  if (error || !license) {
    if (error) console.error('Error fetching claim token:', error)
    return <InvalidClaimLink />
  }

  // Already claimed
  if (license.owner_id) {
    return (
      <div className="bg-slate-50">
        <section className="pt-32 pb-24 px-6 lg:px-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="font-mono text-2xl text-slate-900 mb-2">
              Already Claimed
            </h1>
            <p className="text-slate-600 mb-8">
              This kit has already been claimed. If you own this kit, you can
              access it in your Workshop.
            </p>
            <Button
              asChild
              className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
            >
              <Link href="/workshop">
                Go to Workshop
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    )
  }

  const product = license.product as unknown as {
    name: string
    slug: string
    description: string | null
  } | null

  // Not logged in, redirect to login with claim token.
  if (!user) {
    return (
      <div className="bg-slate-50">
        <section className="pt-32 pb-24 px-6 lg:px-20">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-100 flex items-center justify-center">
                <Package className="w-10 h-10 text-cyan-700" />
              </div>
              <h1 className="font-mono text-2xl text-slate-900 mb-2">
                Claim Your Kit
              </h1>
              <p className="text-slate-600">
                Sign in to claim your purchase and access learning materials.
              </p>
            </div>

            <div className="bg-white rounded border border-slate-200 p-6 mb-6">
              <h2 className="font-mono text-lg text-slate-900 mb-2">
                {product?.name || 'Robotics Kit'}
              </h2>
              {product?.description && (
                <p className="text-sm text-slate-600 mb-4">
                  {product.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
                <span className="px-2 py-1 bg-slate-100 rounded">
                  Code: {license.code}
                </span>
              </div>
            </div>

            <Button
              asChild
              className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
            >
              <Link href={`/login?claim=${token}`}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Claim
              </Link>
            </Button>

            <p className="text-center text-sm text-slate-500 mt-4">
              We&apos;ll send you a magic link - no password needed.
            </p>
          </div>
        </section>
      </div>
    )
  }

  // Logged in, show claim confirmation.
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyan-100 flex items-center justify-center">
              <Package className="w-10 h-10 text-cyan-700" />
            </div>
            <h1 className="font-mono text-2xl text-slate-900 mb-2">
              Claim Your Kit
            </h1>
            <p className="text-slate-600">
              Ready to add this kit to your account.
            </p>
          </div>

          <div className="bg-white rounded border border-slate-200 p-6 mb-6">
            <h2 className="font-mono text-lg text-slate-900 mb-2">
              {product?.name || 'Robotics Kit'}
            </h2>
            {product?.description && (
              <p className="text-sm text-slate-600 mb-4">
                {product.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
              <span className="px-2 py-1 bg-slate-100 rounded">
                Code: {license.code}
              </span>
            </div>
          </div>

          <ClaimButton token={token} />

          <p className="text-center text-sm text-slate-500 mt-4">
            This will link the kit to your account: {user.email}
          </p>
        </div>
      </section>
    </div>
  )
}

function InvalidClaimLink() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="font-mono text-2xl text-slate-900 mb-2">
            Invalid Claim Link
          </h1>
          <p className="text-slate-600 mb-8">
            This claim link is invalid or has already been used. If you
            purchased a kit, check your email for a valid claim link or contact
            support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
            >
              <Link href="/shop">
                <Package className="w-4 h-4 mr-2" />
                Shop Kits
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-200 hover:border-cyan-700 text-slate-600 hover:text-cyan-700 font-mono"
            >
              <Link href="/workshop">Go to Workshop</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
