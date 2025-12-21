import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, Home, ShoppingBag, Calendar, Users, BookOpen, Wrench, ShoppingCart, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import SiteContentEditor from "./SiteContentEditor"

// Category configuration with icons and descriptions
const CATEGORIES = [
  { key: "global", label: "Global", icon: Globe, description: "Footer, header, and site-wide text" },
  { key: "homepage", label: "Homepage", icon: Home, description: "Hero, mission, and homepage sections" },
  { key: "shop", label: "Shop", icon: ShoppingBag, description: "Shop page header and empty states" },
  { key: "events", label: "Events", icon: Calendar, description: "Events page header and empty states" },
  { key: "community", label: "Community", icon: Users, description: "Community page header and empty states" },
  { key: "learn", label: "Learn", icon: BookOpen, description: "Learning platform header and empty states" },
  { key: "workshop", label: "Workshop", icon: Wrench, description: "Workshop dashboard messages" },
  { key: "cart", label: "Cart", icon: ShoppingCart, description: "Shopping cart empty states" },
]

export default async function SiteContentPage() {
  const supabase = await createClient()

  // Fetch all site content
  const { data: content, error } = await supabase
    .from("site_content")
    .select("*")
    .order("category")
    .order("sort_order")

  if (error) {
    console.error("Error fetching site content:", error)
  }

  // Group content by category
  const contentByCategory: Record<string, typeof content> = {}
  for (const cat of CATEGORIES) {
    contentByCategory[cat.key] = (content || []).filter(c => c.category === cat.key)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-900 -ml-2">
              <Link href="/admin/content">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-mono text-slate-900">Site Content</h1>
          <p className="text-slate-600">Edit text across your entire site - headers, empty states, buttons, and more</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Content Categories</CardTitle>
          <CardDescription>
            Select a category to edit its content. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="global" className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-2 bg-slate-100 p-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                const count = contentByCategory[cat.key]?.length || 0
                return (
                  <TabsTrigger
                    key={cat.key}
                    value={cat.key}
                    className="flex items-center gap-2 data-[state=active]:bg-white"
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                    <span className="text-xs text-slate-400">({count})</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {CATEGORIES.map((cat) => (
              <TabsContent key={cat.key} value={cat.key} className="mt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-slate-900">{cat.label}</h3>
                  <p className="text-sm text-slate-500">{cat.description}</p>
                </div>
                <SiteContentEditor
                  content={contentByCategory[cat.key] || []}
                  category={cat.key}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
