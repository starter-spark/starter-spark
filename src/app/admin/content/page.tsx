import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Users } from 'lucide-react'
import Link from 'next/link'

export default async function ContentPage() {
  const supabase = await createClient()

  const { count: teamCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-mono text-slate-900">
          Content Management
        </h1>
        <p className="text-slate-600">
          Team profiles live here; everything else is managed in the{' '}
          <Link href="/admin/cms" className="text-cyan-700 hover:underline">
            CMS
          </Link>
          .
        </p>
      </div>

      {/* Team Members Section */}
      <div>
        <h2 className="text-lg font-mono text-slate-900 mb-4">Team</h2>
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-100 rounded">
                <Users className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>
                  Manage team profiles shown on the About page
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-slate-50 text-slate-600 border-slate-200"
            >
              {teamCount || 0} members
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Add, edit, and reorder team member profiles
              </p>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Link href="/admin/content/team">
                  <Edit className="h-4 w-4 mr-2" />
                  Manage Team
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
