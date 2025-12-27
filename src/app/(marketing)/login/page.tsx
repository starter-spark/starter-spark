import { LoginForm } from './LoginForm'
import { resolveParams, type MaybePromise } from '@/lib/next-params'

export const metadata = {
  title: 'Sign In - StarterSpark Robotics',
  description: 'Sign in to access your kits and learning materials.',
}

interface LoginPageProps {
  searchParams: MaybePromise<{ redirect?: string; claim?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect, claim } = await resolveParams(searchParams)

  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-mono text-3xl text-slate-900 mb-2">Sign In</h1>
            <p className="text-slate-600">
              {claim
                ? 'Sign in to claim your kit license.'
                : 'Access your kits and learning materials.'}
            </p>
          </div>

          <div className="bg-white rounded border border-slate-200 p-8">
            <LoginForm redirectTo={redirect} claimToken={claim} />
          </div>

          <p className="text-center text-sm text-slate-600 mt-6">
            We&apos;ll send you a magic link to sign in. No password needed.
          </p>
        </div>
      </section>
    </div>
  )
}
