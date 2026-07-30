import { getCollection } from '@/cms/content'
import { AboutTeam } from './AboutTeam'

export async function AboutTeamWrapper() {
  const members = await getCollection('team_member')

  // Render every visible entry in order — the collection is the source of
  // truth, no hardcoded names or counts.
  const team = members
    .filter((m) => m.data.visible)
    .map((m) => ({
      name: m.data.name,
      role: m.data.role,
      bio: m.data.bio,
      image: m.data.imageUrl || undefined,
      github: m.data.githubUrl || undefined,
      linkedin: m.data.linkedinUrl || undefined,
      twitter: m.data.twitterUrl || undefined,
    }))

  return <AboutTeam team={team} />
}
