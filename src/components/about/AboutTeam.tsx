'use client'

import { Card, CardContent } from '@/components/ui/card'
import { GithubIcon, LinkedinIcon } from '@/components/icons/brand-icons'
import { Twitter } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'

interface TeamMember {
  name: string
  role: string
  bio: string
  image?: string
  github?: string
  linkedin?: string
  twitter?: string
}

interface AboutTeamProps {
  team?: TeamMember[]
}

// Fallback team data (used if database is empty)
const defaultTeam: TeamMember[] = [
  {
    name: 'Josh Zhang',
    role: 'Marketing & Business',
    bio: 'Team member bio coming soon.',
    github: 'https://github.com/thebestjosh',
    linkedin: 'https://www.linkedin.com/in/josh-zhang-36aa02352/',
  },
  {
    name: 'Vincent Lau',
    role: 'Kit Design & CAD',
    bio: 'Team member bio coming soon.',
  },
  {
    name: 'Ryder Kawachika',
    role: 'Kit Design & CAD',
    bio: 'Team member bio coming soon.',
    github: 'https://github.com/rydertk',
  },
  {
    name: 'Kai Stewart',
    role: 'Web Development',
    bio: 'lead developer.',
    github: 'https://github.com/normalday843812',
    linkedin: 'https://www.linkedin.com/in/kai-stewart-b88841395/',
  },
]

export function AboutTeam({ team = defaultTeam }: AboutTeamProps) {
  const displayTeam = team.length > 0 ? team : defaultTeam
  return (
    <section className="py-24 px-6 lg:px-20 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-mono text-3xl lg:text-4xl text-slate-900 mb-4">
            Meet the Team
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Four students from Honolulu who believe engineering should be for
            everyone.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayTeam.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Avatar */}
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                    {member.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={member.image}
                        alt={member.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-mono text-cyan-700">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className="font-mono text-lg text-slate-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-sm font-mono text-cyan-700 mb-3">
                      {member.role}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                      {member.bio}
                    </p>

                    {/* Social Links */}
                    <div className="flex justify-center gap-2">
                      {member.github && (
                        <Link
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-500 hover:text-cyan-700 transition-colors"
                          aria-label={`${member.name}'s GitHub profile`}
                        >
                          <GithubIcon className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      )}
                      {member.linkedin && (
                        <Link
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-500 hover:text-cyan-700 transition-colors"
                          aria-label={`${member.name}'s LinkedIn profile`}
                        >
                          <LinkedinIcon
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        </Link>
                      )}
                      {member.twitter && (
                        <Link
                          href={member.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-500 hover:text-cyan-700 transition-colors"
                          aria-label={`${member.name}'s Twitter profile`}
                        >
                          <Twitter className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
