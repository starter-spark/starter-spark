import Link from 'next/link'
import type { Metadata } from 'next'
import {
  compactPrimaryLink,
  compactSecondaryLink,
} from '@/components/marketing/link-classes'

export const metadata: Metadata = {
  title: 'Claim a Kit',
  description:
    'Use the claim link from your email to activate your kit license.',
}

export default function ClaimPage() {
  return (
    <div className="min-h-[60vh] bg-white px-6 py-24 lg:px-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-mono text-cyan-700 mb-3">Claim a Kit</p>
        <h1 className="font-mono text-3xl lg:text-4xl text-slate-900 mb-4">
          Use your claim link
        </h1>
        <p className="text-slate-600 leading-relaxed mb-8">
          Claim links are unique to your purchase. Please open the link from
          your email to activate your kit license. If you need help, we&apos;re
          here for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/workshop"
            className={compactPrimaryLink}
          >
            Go to Workshop
          </Link>
          <Link
            href="/support"
            className={compactSecondaryLink}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
