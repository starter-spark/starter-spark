'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, History, Loader2, Save, Trash2, Upload } from 'lucide-react'
import { discardCmsDraft, publishCmsVersion, saveCmsDraft } from '@/cms/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { isoToLocalDatetimeInput } from '@/lib/datetime'
import type { SerializedField } from '../../lib'

export interface CmsHistoryRow {
  id: string
  version: number
  note: string | null
  createdAt: string
  isPublished: boolean
  isDraft: boolean
}

interface CmsDocumentEditorProps {
  type: string
  typeKey: string
  initialData: Record<string, unknown>
  baseVersion: number
  hasDraft: boolean
  isPublished: boolean
  history: CmsHistoryRow[]
  fields: SerializedField[]
}

type PendingAction = 'save' | 'publish' | 'discard' | 'restore' | null

function fieldValue(data: Record<string, unknown>, name: string): unknown {
  return Object.entries(data).find(([key]) => key === name)?.[1]
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

export function CmsDocumentEditor({
  type,
  typeKey,
  initialData,
  baseVersion: initialBaseVersion,
  hasDraft: initialHasDraft,
  isPublished: initialIsPublished,
  history,
  fields,
}: CmsDocumentEditorProps) {
  const router = useRouter()
  const [data, setData] = useState<Record<string, unknown>>(initialData)
  const [baseVersion, setBaseVersion] = useState(initialBaseVersion)
  const [hasDraft, setHasDraft] = useState(initialHasDraft)
  const [isPublished, setIsPublished] = useState(initialIsPublished)
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(initialData))
  const [note, setNote] = useState('')
  const [pending, setPending] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)
  const [successNote, setSuccessNote] = useState<string | null>(null)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<CmsHistoryRow | null>(null)

  const isDirty = useMemo(
    () => JSON.stringify(data) !== snapshot,
    [data, snapshot],
  )

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && pending === null) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, pending])

  const setField = (name: string, value: unknown) => {
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const trimmedNote = note.trim()

  const saveDraft = async (): Promise<number | null> => {
    const result = await saveCmsDraft({
      type,
      key: typeKey,
      data,
      baseVersion,
      note: trimmedNote ? trimmedNote : undefined,
    })
    if (!result.success) {
      setError(result.error ?? 'Save failed')
      return null
    }
    const version = typeof result.version === 'number' ? result.version : null
    if (version !== null) setBaseVersion(version)
    setSnapshot(JSON.stringify(data))
    setHasDraft(true)
    setNote('')
    return version ?? baseVersion + 1
  }

  const handleSave = async () => {
    setPending('save')
    setError(null)
    setSuccessNote(null)
    const version = await saveDraft()
    if (version !== null) {
      setSuccessNote(`Draft saved as v${version}`)
      router.refresh()
    }
    setPending(null)
  }

  const handlePublish = async () => {
    setPending('publish')
    setError(null)
    setSuccessNote(null)

    // A dirty form (or a never-saved singleton) needs a draft to publish
    if (isDirty || baseVersion === 0) {
      const version = await saveDraft()
      if (version === null) {
        setPending(null)
        return
      }
    }

    const result = await publishCmsVersion({ type, key: typeKey })
    if (result.success) {
      setIsPublished(true)
      setHasDraft(false)
      setSuccessNote(
        typeof result.version === 'number'
          ? `Published v${result.version} — it is live now`
          : 'Published — it is live now',
      )
      router.refresh()
    } else {
      setError(result.error ?? 'Publish failed')
    }
    setPending(null)
  }

  const handleDiscard = async () => {
    setPending('discard')
    setError(null)
    setSuccessNote(null)
    const result = await discardCmsDraft({ type, key: typeKey })
    if (result.success) {
      setHasDraft(false)
      setSuccessNote('Draft discarded — the published version stays live')
      router.refresh()
    } else {
      setError(result.error ?? 'Discard failed')
    }
    setPending(null)
    setIsDiscardDialogOpen(false)
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    setPending('restore')
    setError(null)
    setSuccessNote(null)
    const result = await publishCmsVersion({
      type,
      key: typeKey,
      versionId: restoreTarget.id,
    })
    if (result.success) {
      setIsPublished(true)
      if (restoreTarget.isDraft) setHasDraft(false)
      setSuccessNote(`Restored and published v${restoreTarget.version}`)
      router.refresh()
    } else {
      setError(result.error ?? 'Restore failed')
    }
    setPending(null)
    setRestoreTarget(null)
  }

  const nothingToPublish = !isDirty && !hasDraft && isPublished

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {error && (
          <div
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}
        {successNote && !error && (
          <div
            role="status"
            className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {successNote}
          </div>
        )}

        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Content</CardTitle>
            <div className="flex flex-wrap gap-1">
              {hasDraft && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  Draft
                </Badge>
              )}
              {isPublished && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Published
                </Badge>
              )}
              {!hasDraft && !isPublished && (
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-slate-600 border-slate-200"
                >
                  Unpublished
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {fields.map((field) => {
              const inputId = `cms-field-${field.name}`
              const value = fieldValue(data, field.name)
              return (
                <div key={field.name} className="space-y-2">
                  {field.widget === 'checkbox' ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label htmlFor={inputId}>{field.label}</Label>
                        {field.help && (
                          <p className="text-sm text-slate-500">{field.help}</p>
                        )}
                      </div>
                      <Switch
                        id={inputId}
                        checked={Boolean(value)}
                        onCheckedChange={(checked) => {
                          setField(field.name, checked)
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={inputId}>{field.label}</Label>
                      {field.widget === 'textarea' ? (
                        <Textarea
                          id={inputId}
                          rows={4}
                          value={asText(value)}
                          onChange={(e) => {
                            setField(field.name, e.target.value)
                          }}
                        />
                      ) : field.widget === 'number' ? (
                        <Input
                          id={inputId}
                          type="number"
                          value={typeof value === 'number' ? value : 0}
                          onChange={(e) => {
                            const parsed = Number(e.target.value)
                            setField(
                              field.name,
                              Number.isNaN(parsed) ? 0 : parsed,
                            )
                          }}
                        />
                      ) : field.widget === 'datetime' ? (
                        <Input
                          id={inputId}
                          type="datetime-local"
                          value={isoToLocalDatetimeInput(asText(value))}
                          onChange={(e) => {
                            // Stored as ISO (UTC); empty clears the bound
                            setField(
                              field.name,
                              e.target.value === ''
                                ? ''
                                : new Date(e.target.value).toISOString(),
                            )
                          }}
                        />
                      ) : field.widget === 'select' ? (
                        <Select
                          value={
                            typeof value === 'string' && value !== ''
                              ? value
                              : undefined
                          }
                          onValueChange={(next) => {
                            setField(field.name, next)
                          }}
                        >
                          <SelectTrigger id={inputId} className="w-full">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options ?? []).map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={inputId}
                          value={asText(value)}
                          onChange={(e) => {
                            setField(field.name, e.target.value)
                          }}
                        />
                      )}
                      {field.help && (
                        <p className="text-sm text-slate-500">{field.help}</p>
                      )}
                    </>
                  )}
                </div>
              )
            })}

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Label htmlFor="cms-version-note">Version note (optional)</Label>
              <Input
                id="cms-version-note"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value)
                }}
                placeholder="What changed?"
              />
              <p className="text-sm text-slate-500">
                Shown in the version history to explain this save.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => void handleSave()}
            disabled={pending !== null}
            variant="outline"
          >
            {pending === 'save' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save draft
          </Button>
          <Button
            onClick={() => void handlePublish()}
            disabled={pending !== null || nothingToPublish}
            className="bg-cyan-700 hover:bg-cyan-600"
          >
            {pending === 'publish' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
          {hasDraft && (
            <Button
              onClick={() => {
                setIsDiscardDialogOpen(true)
              }}
              disabled={pending !== null}
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Discard draft
            </Button>
          )}
          <Button asChild variant="ghost" className="text-slate-600">
            <a href="/api/cms/preview?redirect=/">
              <Eye className="mr-2 h-4 w-4" />
              Preview drafts on site
            </a>
          </Button>
          {isDirty && (
            <span className="text-sm text-amber-600">Unsaved changes</span>
          )}
        </div>
      </div>

      <div>
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-4 w-4 text-slate-500" />
              History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">
                No versions yet. Save a draft to start the history.
              </p>
            ) : (
              <ul className="space-y-3">
                {history.map((version) => (
                  <li
                    key={version.id}
                    className="rounded border border-slate-200 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-medium text-slate-900">
                          v{version.version}
                        </span>
                        {version.isPublished && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Published
                          </Badge>
                        )}
                        {version.isDraft && (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 border-amber-200"
                          >
                            Draft
                          </Badge>
                        )}
                      </div>
                      {!version.isPublished && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending !== null}
                          onClick={() => {
                            setRestoreTarget(version)
                          }}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                    {version.note && (
                      <p className="mt-1 text-sm text-slate-600">
                        {version.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Discard draft confirmation */}
      <AlertDialog
        open={isDiscardDialogOpen}
        onOpenChange={setIsDiscardDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard draft</AlertDialogTitle>
            <AlertDialogDescription>
              This drops the current draft. The published version keeps
              rendering on the site, and older versions stay in the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDiscard()}
              className="bg-red-600 hover:bg-red-700"
            >
              {pending === 'discard' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore confirmation */}
      <AlertDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Restore v{restoreTarget?.version}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This publishes version {restoreTarget?.version} immediately. The
              form below keeps your current values until you reload.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleRestore()}
              className="bg-cyan-700 hover:bg-cyan-600"
            >
              {pending === 'restore' && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
