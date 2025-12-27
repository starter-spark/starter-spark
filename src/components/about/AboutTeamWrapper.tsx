import { createPublicClient } from '@/lib/supabase/public'
import { AboutTeam } from './AboutTeam'

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
}

export async function AboutTeamWrapper() {
  let members: TeamMember[] = []
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('team_members')
      .select('id, name, role, bio, image_url, social_links')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching team members:', error)
    }
    members = (data as TeamMember[]) || []
  } catch (error) {
    console.error('Error fetching team members:', error)
  }

  // Transform to match the expected format
  const team = members.map((m) => {
    const socialLinks = m.social_links
    return {
      name: m.name,
      role: m.role,
      bio: m.bio || '',
      image: m.image_url || undefined,
      github: socialLinks?.github,
      linkedin: socialLinks?.linkedin,
      twitter: socialLinks?.twitter,
    }
  })

  return <AboutTeam team={team} />
}
