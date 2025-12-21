"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, RotateCcw, Check, Loader2, Type, FileText, AlertCircle } from "lucide-react"
import { updateSiteContent } from "./actions"

interface ContentItem {
  id: string
  content_key: string
  content_type: string
  content: string
  default_value: string | null
  description: string | null
  category: string
  sort_order: number | null
  updated_at: string | null
}

interface SiteContentEditorProps {
  content: ContentItem[]
  category: string
}

export default function SiteContentEditor({ content }: SiteContentEditorProps) {
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleContentChange = (key: string, value: string) => {
    setEditedContent(prev => ({ ...prev, [key]: value }))
    // Remove from saved set when content changes
    setSavedItems(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  const handleSave = (item: ContentItem) => {
    const newContent = editedContent[item.content_key] ?? item.content
    if (newContent === item.content && !editedContent[item.content_key]) return

    setError(null)
    setSavingKey(item.content_key)
    startTransition(async () => {
      const result = await updateSiteContent(item.id, newContent)
      if (result.error) {
        setError(result.error)
      } else {
        // Mark as saved
        setSavedItems(prev => new Set(prev).add(item.content_key))
        // Update the local state to reflect saved content
        item.content = newContent
      }
      setSavingKey(null)
    })
  }

  const handleReset = (item: ContentItem) => {
    if (item.default_value) {
      setEditedContent(prev => ({ ...prev, [item.content_key]: item.default_value! }))
    }
  }

  const getDisplayKey = (key: string) => {
    // Convert content_key to human-readable label
    // e.g., "home.hero.headline" -> "Hero Headline"
    const parts = key.split(".")
    // Remove category prefix
    const relevantParts = parts.slice(1)
    return relevantParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).replaceAll('_', " "))
      .join(" ")
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
        <p>No content items in this category.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {content.map((item) => {
        const currentValue = editedContent[item.content_key] ?? item.content
        const isModified = currentValue !== item.content
        const isSaved = savedItems.has(item.content_key)
        const isSaving = savingKey === item.content_key
        const isRichText = item.content_type === "rich_text"

        return (
          <Card key={item.id} className="bg-slate-50 border-slate-200">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Label className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      {isRichText ? (
                        <FileText className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Type className="h-4 w-4 text-slate-500" />
                      )}
                      {getDisplayKey(item.content_key)}
                    </Label>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isModified && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                        Modified
                      </Badge>
                    )}
                    {isSaved && !isModified && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Saved
                      </Badge>
                    )}
                  </div>
                </div>

                {isRichText ? (
                  <Textarea
                    value={currentValue}
                    onChange={(e) => { handleContentChange(item.content_key, e.target.value); }}
                    className="min-h-[100px] bg-white text-slate-900"
                    placeholder={item.default_value || "Enter content..."}
                  />
                ) : (
                  <Input
                    value={currentValue}
                    onChange={(e) => { handleContentChange(item.content_key, e.target.value); }}
                    className="bg-white text-slate-900"
                    placeholder={item.default_value || "Enter content..."}
                  />
                )}

                <div className="flex items-center justify-between pt-1">
                  <code className="text-xs text-slate-400 font-mono">{item.content_key}</code>
                  <div className="flex items-center gap-2">
                    {item.default_value && currentValue !== item.default_value && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { handleReset(item); }}
                        className="text-slate-500 hover:text-slate-700 h-8"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Reset
                      </Button>
                    )}
                    <Button
                      variant={isModified ? "default" : "outline"}
                      size="sm"
                      onClick={() => { handleSave(item); }}
                      disabled={!isModified || isPending}
                      className={isModified ? "bg-cyan-700 hover:bg-cyan-600 h-8" : "h-8"}
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
