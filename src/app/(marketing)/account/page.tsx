import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AccountSettings } from './AccountSettings'

export const metadata = {
  title: 'Account Settings | Starter Spark',
  description: 'Manage your account settings and profile',
}

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/account')
  }

  // Fetch the user's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, avatar_url, avatar_seed, role, is_banned_from_forums, ban_reason, created_at',
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile:', error)
  }

  // Combine auth user and profile data
  const userData = {
    id: user.id,
    email: user.email || profile?.email || '',
    full_name: profile?.full_name || null,
    avatar_url: profile?.avatar_url || null,
    avatar_seed: profile?.avatar_seed || null,
    role: profile?.role || 'user',
    is_banned_from_forums: profile?.is_banned_from_forums || false,
    ban_reason: profile?.ban_reason || null,
    created_at: profile?.created_at || user.created_at,
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="font-mono text-2xl font-bold text-slate-900">
          Account Settings
        </h1>
        <p className="mt-1 text-slate-600">
          Manage your profile and account preferences
        </p>

        <AccountSettings user={userData} />
      </div>
    </main>
  )
}
