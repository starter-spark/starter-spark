import { createClient } from '@/lib/supabase/server'
import { TeamManager } from './TeamManager'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string | null
  image_url: string | null
  social_links: {
    github?: string
    linkedin?: string
    twitter?: string
  } | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export default async function TeamPage() {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('team_members')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching team members:', error)
  }

  // Map database results to properly typed TeamMember array
  const typedMembers: TeamMember[] = (members || []).map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    bio: m.bio,
    image_url: m.image_url,
    social_links: m.social_links as TeamMember['social_links'],
    sort_order: m.sort_order ?? 0,
    is_active: m.is_active ?? true,
    created_at: m.created_at ?? new Date().toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono text-slate-900">Team Members</h1>
        <p className="text-slate-600">
          Manage team profiles shown on the About page
        </p>
      </div>

      <TeamManager initialMembers={typedMembers} />
    </div>
  )
}
