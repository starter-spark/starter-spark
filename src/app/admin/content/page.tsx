import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle, Edit, Users, Info, BookOpen, Plus, Globe, ExternalLink, Type } from "lucide-react"
import Link from "next/link"

// Page metadata for system pages
const SYSTEM_PAGE_METADATA: Record<string, { title: string; description: string; icon: typeof FileText }> = {
  privacy: {
    title: "Privacy Policy",
    description: "How we collect, use, and protect user data",
    icon: FileText,
  },
  terms: {
    title: "Terms of Service",
    description: "Legal terms for using our products and services",
    icon: FileText,
  },
  about_hero: {
    title: "About Page Hero",
    description: "Main headline and description on the About page",
    icon: Info,
  },
  about_story: {
    title: "Our Story",
    description: "The story section on the About page",
    icon: BookOpen,
  },
}

// System page keys (not custom pages)
const SYSTEM_PAGE_KEYS = new Set(["privacy", "terms", "about_hero", "about_story"])

export default async function ContentPage() {
  const supabase = await createClient()

  // Fetch all page content (admin can see drafts too)
  const { data: allPages, error } = await supabase
    .from("page_content")
    .select("*")
    .order("page_key")

  // Fetch team member count
  const { count: teamCount } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })

  if (error) {
    console.error("Error fetching pages:", error)
  }

  // Separate system pages from custom pages
  const systemPages = (allPages || []).filter(
    (page) => SYSTEM_PAGE_KEYS.has(page.page_key) || !page.is_custom_page
  )
  const customPages = (allPages || []).filter((page) => page.is_custom_page)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-mono text-slate-900">Content Management</h1>
        <p className="text-slate-600">Edit static pages, team profiles, and site content</p>
      </div>

      {/* Site Content Section */}
      <div>
        <h2 className="text-lg font-mono text-slate-900 mb-4">Site Content</h2>
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-100 rounded">
                <Type className="h-5 w-5 text-cyan-700" />
              </div>
              <div>
                <CardTitle className="text-lg">Site-Wide Text</CardTitle>
                <CardDescription>Edit headers, empty states, buttons, and text across the entire site</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Customize text on homepage, shop, events, community, and more
              </p>
              <Button asChild size="sm" className="bg-cyan-700 hover:bg-cyan-600">
                <Link href="/admin/content/site">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Site Content
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
                <CardDescription>Manage team profiles shown on the About page</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
              {teamCount || 0} members
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Add, edit, and reorder team member profiles
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/content/team">
                  <Edit className="h-4 w-4 mr-2" />
                  Manage Team
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Pages Section */}
      <div>
        <h2 className="text-lg font-mono text-slate-900 mb-4">System Pages</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {systemPages.map((page) => {
            const meta = SYSTEM_PAGE_METADATA[page.page_key] || {
              title: page.title,
              description: "Editable page content",
              icon: FileText,
            }
            const Icon = meta.icon
            const isPublished = !!page.published_at
            const lastUpdated = page.updated_at
              ? new Date(page.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null

            return (
              <Card key={page.id} className="bg-white border-slate-200">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{meta.title}</CardTitle>
                      <CardDescription>{meta.description}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isPublished
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }
                  >
                    {isPublished ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Published
                      </>
                    ) : (
                      "Draft"
                    )}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      {lastUpdated ? `Updated ${lastUpdated}` : "Never updated"}
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/content/${page.page_key}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {systemPages.length === 0 && (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">No system pages found.</p>
              <p className="text-sm text-slate-500 mt-1">
                Pages will appear here once the database is seeded.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Custom Pages Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono text-slate-900">Custom Pages</h2>
          <Button asChild size="sm" className="bg-cyan-700 hover:bg-cyan-600">
            <Link href="/admin/content/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Page
            </Link>
          </Button>
        </div>

        {customPages.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {customPages.map((page) => {
              const isPublished = !!page.published_at
              const lastUpdated = page.updated_at
                ? new Date(page.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : null

              return (
                <Card key={page.id} className="bg-white border-slate-200">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-cyan-100 rounded">
                        <Globe className="h-5 w-5 text-cyan-700" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{page.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          /p/{page.slug}
                          {isPublished && (
                            <a
                              href={`/p/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-700 hover:text-cyan-600"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        isPublished
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {isPublished ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Published
                        </>
                      ) : (
                        "Draft"
                      )}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="h-4 w-4" />
                        {lastUpdated ? `Updated ${lastUpdated}` : "Never updated"}
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/content/${page.page_key}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">No custom pages yet.</p>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                Create custom markdown pages for FAQs, announcements, or any other content.
              </p>
              <Button asChild size="sm" className="bg-cyan-700 hover:bg-cyan-600">
                <Link href="/admin/content/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Page
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
