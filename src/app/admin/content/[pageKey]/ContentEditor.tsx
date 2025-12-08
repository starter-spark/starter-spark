"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Eye, CheckCircle, Loader2, EyeOff } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { updatePageContent, unpublishPageContent } from "../actions"

interface PageContent {
  id: string
  page_key: string
  title: string
  content: string
  published_at: string | null
  updated_at: string | null
  version: number | null
}

interface ContentEditorProps {
  page: PageContent
}

// Map page_key to actual live URL
// About page sections don't have their own URLs - they appear on /about
const PAGE_URL_MAP: Record<string, { url: string; label: string } | null> = {
  privacy: { url: "/privacy", label: "This page is live at" },
  terms: { url: "/terms", label: "This page is live at" },
  about_hero: { url: "/about", label: "This content appears on" },
  about_story: { url: "/about", label: "This content appears on" },
}

export function ContentEditor({ page }: ContentEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content)
  const [activeTab, setActiveTab] = useState<string>("edit")

  // Parse about_hero JSON content for structured editing
  const isAboutHero = page.page_key === "about_hero"
  const [heroHeadline, setHeroHeadline] = useState(() => {
    if (isAboutHero) {
      try {
        const parsed = JSON.parse(page.content)
        return parsed.headline || ""
      } catch {
        return ""
      }
    }
    return ""
  })
  const [heroDescription, setHeroDescription] = useState(() => {
    if (isAboutHero) {
      try {
        const parsed = JSON.parse(page.content)
        return parsed.description || ""
      } catch {
        return ""
      }
    }
    return ""
  })

  // Update content when hero fields change
  const updateHeroContent = (headline: string, description: string) => {
    setContent(JSON.stringify({ headline, description }, null, 2))
  }

  const isPublished = !!page.published_at

  const handleSave = (publish: boolean = false) => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await updatePageContent(page.page_key, {
        title,
        content,
        publish,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(publish ? "Page published successfully!" : "Draft saved successfully!")
        router.refresh()
      }
    })
  }

  const handleUnpublish = () => {
    if (!confirm("Are you sure you want to unpublish this page? It will no longer be visible to the public.")) {
      return
    }

    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await unpublishPageContent(page.page_key)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Page unpublished successfully!")
        router.refresh()
      }
    })
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/content">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-mono text-slate-900">Edit {page.title}</h1>
            <p className="text-sm text-slate-500">
              Version {page.version || 1} &bull;{" "}
              {page.updated_at
                ? `Last updated ${new Date(page.updated_at).toLocaleDateString()}`
                : "Never updated"}
            </p>
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
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Editor */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle>{isAboutHero ? "About Page Hero" : "Page Content"}</CardTitle>
          <CardDescription>
            {isAboutHero
              ? "Edit the headline and description that appear at the top of the About page."
              : "Edit the content using Markdown. Use the Preview tab to see how it will look."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-slate-900">
              Page Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter page title"
            />
          </div>

          {/* Structured form for about_hero */}
          {isAboutHero ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="hero-headline" className="text-sm font-medium text-slate-900">
                  Headline
                </label>
                <p className="text-xs text-slate-500">
                  Use a colon (:) to split the headline. Text after the colon will be highlighted in cyan.
                  <br />
                  Example: &quot;Our Mission: Ignite STEM Curiosity&quot;
                </p>
                <Input
                  id="hero-headline"
                  value={heroHeadline}
                  onChange={(e) => {
                    setHeroHeadline(e.target.value)
                    updateHeroContent(e.target.value, heroDescription)
                  }}
                  placeholder="e.g., Making Robotics Education: Accessible to Everyone"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="hero-description" className="text-sm font-medium text-slate-900">
                  Description
                </label>
                <textarea
                  id="hero-description"
                  value={heroDescription}
                  onChange={(e) => {
                    setHeroDescription(e.target.value)
                    updateHeroContent(heroHeadline, e.target.value)
                  }}
                  className="w-full h-32 font-mono text-sm p-4 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2"
                  placeholder="Enter a brief description of your mission..."
                />
              </div>
              {/* Preview */}
              <div className="p-6 bg-slate-50 rounded border border-slate-200">
                <p className="text-xs text-slate-500 mb-4">Preview:</p>
                <p className="text-sm font-mono text-cyan-700 mb-2">Our Mission</p>
                <h1 className="font-mono text-2xl font-bold text-slate-900 mb-4">
                  {heroHeadline.includes(":") ? (
                    <>
                      {heroHeadline.split(":")[0]}:
                      <span className="text-cyan-700"> {heroHeadline.split(":").slice(1).join(":").trim()}</span>
                    </>
                  ) : (
                    heroHeadline || "Your headline here"
                  )}
                </h1>
                <p className="text-slate-600">{heroDescription || "Your description here"}</p>
              </div>
            </div>
          ) : (
            /* Content Editor with Tabs for markdown pages */
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900">Content (Markdown)</label>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-2">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-[500px] font-mono text-sm p-4 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2"
                    placeholder="Enter Markdown content..."
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-2">
                  <div className="w-full min-h-[500px] p-6 border border-slate-200 rounded-md bg-slate-50 prose prose-slate max-w-none">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {isPublished && (
            <Button
              type="button"
              variant="outline"
              onClick={handleUnpublish}
              disabled={isPending}
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Unpublish
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="bg-cyan-700 hover:bg-cyan-600"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isPublished ? "Update & Publish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Preview Link */}
      {isPublished && PAGE_URL_MAP[page.page_key] && (
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="py-4">
            <p className="text-sm text-slate-600">
              {PAGE_URL_MAP[page.page_key]!.label}:{" "}
              <a
                href={PAGE_URL_MAP[page.page_key]!.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-700 hover:underline"
              >
                {PAGE_URL_MAP[page.page_key]!.url}
              </a>
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
