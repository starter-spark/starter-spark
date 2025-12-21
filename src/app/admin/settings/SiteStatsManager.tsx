"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Pencil, X, Plus, Trash2, RefreshCw, Database } from "lucide-react"
import { updateSiteStat, createSiteStat, deleteSiteStat } from "./actions"

// Available auto sources for stats calculation
const AUTO_SOURCES = [
  { value: "licenses_count", label: "Claimed Licenses", description: "Count of licenses with an owner" },
  { value: "events_count", label: "Past Events", description: "Count of past public events" },
  { value: "profiles_count", label: "Registered Users", description: "Total registered users" },
  { value: "posts_count", label: "Community Posts", description: "Published community questions" },
  { value: "comments_count", label: "Comments/Answers", description: "Total answers in community" },
] as const

interface SiteStat {
  id: string
  key: string
  value: number
  label: string
  suffix: string | null
  is_auto_calculated: boolean | null
  auto_source: string | null
}

interface SiteStatsManagerProps {
  stats: SiteStat[]
}

export function SiteStatsManager({ stats: initialStats }: SiteStatsManagerProps) {
  const [stats, setStats] = useState(initialStats)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Edit form state
  const [editValue, setEditValue] = useState(0)
  const [editLabel, setEditLabel] = useState("")
  const [editSuffix, setEditSuffix] = useState("")
  const [editIsAuto, setEditIsAuto] = useState(false)
  const [editAutoSource, setEditAutoSource] = useState<string | null>(null)

  // New stat form state
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState(0)
  const [newLabel, setNewLabel] = useState("")
  const [newSuffix, setNewSuffix] = useState("")
  const [newIsAuto, setNewIsAuto] = useState(false)
  const [newAutoSource, setNewAutoSource] = useState<string | null>(null)

  const startEditing = (stat: SiteStat) => {
    setEditingId(stat.id)
    setEditValue(stat.value)
    setEditLabel(stat.label)
    setEditSuffix(stat.suffix || "")
    setEditIsAuto(stat.is_auto_calculated || false)
    setEditAutoSource(stat.auto_source || null)
    setError(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setError(null)
  }

  const handleUpdate = (id: string) => {
    startTransition(async () => {
      const result = await updateSiteStat({
        id,
        value: editValue,
        label: editLabel,
        suffix: editSuffix,
        is_auto_calculated: editIsAuto,
        auto_source: editIsAuto ? editAutoSource : null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        // Update local state
        setStats(
          stats.map((s) =>
            s.id === id
              ? {
                  ...s,
                  value: editValue,
                  label: editLabel,
                  suffix: editSuffix,
                  is_auto_calculated: editIsAuto,
                  auto_source: editIsAuto ? editAutoSource : null,
                }
              : s
          )
        )
        setEditingId(null)
        setError(null)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this stat?")) return

    startTransition(async () => {
      const result = await deleteSiteStat(id)

      if (result.error) {
        setError(result.error)
      } else {
        setStats(stats.filter((s) => s.id !== id))
        setError(null)
      }
    })
  }

  const handleCreate = () => {
    if (!newKey.trim() || !newLabel.trim()) {
      setError("Key and label are required")
      return
    }

    if (newIsAuto && !newAutoSource) {
      setError("Please select a data source for auto-calculation")
      return
    }

    startTransition(async () => {
      const result = await createSiteStat({
        key: newKey.toLowerCase().replaceAll(/\s+/g, "_"),
        value: newValue,
        label: newLabel,
        suffix: newSuffix,
        is_auto_calculated: newIsAuto,
        auto_source: newIsAuto ? newAutoSource : null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        // Reset form and close
        setNewKey("")
        setNewValue(0)
        setNewLabel("")
        setNewSuffix("")
        setNewIsAuto(false)
        setNewAutoSource(null)
        setIsAdding(false)
        setError(null)
        // Note: Page will revalidate and show new stat
        globalThis.location.reload()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Homepage Stats</CardTitle>
            <CardDescription>
              Manage the impact stats shown on the homepage
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setIsAdding(true); }}
            disabled={isAdding}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Stat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* New stat form */}
          {isAdding && (
            <div className="rounded-lg border-2 border-dashed border-cyan-200 bg-cyan-50/50 p-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Key
                  </label>
                  <Input
                    value={newKey}
                    onChange={(e) => { setNewKey(e.target.value); }}
                    placeholder="kits_deployed"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Label
                  </label>
                  <Input
                    value={newLabel}
                    onChange={(e) => { setNewLabel(e.target.value); }}
                    placeholder="Kits Deployed"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Value
                  </label>
                  <Input
                    type="number"
                    value={newValue}
                    onChange={(e) => { setNewValue(Number.parseInt(e.target.value) || 0); }}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Suffix
                  </label>
                  <Input
                    value={newSuffix}
                    onChange={(e) => { setNewSuffix(e.target.value); }}
                    placeholder="+ or %"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsAuto}
                      onChange={(e) => {
                        setNewIsAuto(e.target.checked)
                        if (!e.target.checked) setNewAutoSource(null)
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-700 cursor-pointer"
                    />
                    Auto-calculated from database
                  </label>
                  {newIsAuto && (
                    <Select
                      value={newAutoSource || ""}
                      onValueChange={(value) => { setNewAutoSource(value); }}
                    >
                      <SelectTrigger className="w-[200px] text-sm">
                        <SelectValue placeholder="Select data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTO_SOURCES.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            <div className="flex items-center gap-2">
                              <Database className="h-3 w-3 text-cyan-600" />
                              {source.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAdding(false)
                      setNewAutoSource(null)
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { handleCreate(); }}
                    disabled={isPending}
                    className="bg-cyan-700 hover:bg-cyan-600"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Existing stats */}
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              {editingId === stat.id ? (
                /* Edit mode */
                <div className="flex-1 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Label
                      </label>
                      <Input
                        value={editLabel}
                        onChange={(e) => { setEditLabel(e.target.value); }}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Value
                      </label>
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) =>
                          { setEditValue(Number.parseInt(e.target.value) || 0); }
                        }
                        className="text-sm"
                        disabled={editIsAuto}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Suffix
                      </label>
                      <Input
                        value={editSuffix}
                        onChange={(e) => { setEditSuffix(e.target.value); }}
                        placeholder="+ or %"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsAuto}
                          onChange={(e) => {
                            setEditIsAuto(e.target.checked)
                            if (!e.target.checked) setEditAutoSource(null)
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-cyan-700 cursor-pointer"
                        />
                        Auto-calculated
                      </label>
                      {editIsAuto && (
                        <Select
                          value={editAutoSource || ""}
                          onValueChange={(value) => { setEditAutoSource(value); }}
                        >
                          <SelectTrigger className="w-[180px] text-sm">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            {AUTO_SOURCES.map((source) => (
                              <SelectItem key={source.value} value={source.value}>
                                <div className="flex items-center gap-2">
                                  <Database className="h-3 w-3 text-cyan-600" />
                                  {source.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelEditing}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={() => { handleUpdate(stat.id); }}
                        disabled={isPending || (editIsAuto && !editAutoSource)}
                        className="bg-cyan-700 hover:bg-cyan-600"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <p className="font-mono text-2xl font-bold text-slate-900">
                        {stat.value}
                        {stat.suffix && (
                          <span className="text-cyan-700">{stat.suffix}</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{stat.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                          {stat.key}
                        </code>
                        {stat.is_auto_calculated === true && (
                          <Badge
                            variant="outline"
                            className="border-cyan-200 text-cyan-700 text-xs"
                            title={stat.auto_source ? `Source: ${AUTO_SOURCES.find(s => s.value === stat.auto_source)?.label || stat.auto_source}` : "Auto-calculated"}
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            {stat.auto_source
                              ? AUTO_SOURCES.find(s => s.value === stat.auto_source)?.label || "Auto"
                              : "Auto"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { startEditing(stat); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { handleDelete(stat.id); }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {stats.length === 0 && !isAdding && (
            <div className="text-center py-8 text-slate-500">
              <p>No stats configured yet.</p>
              <Button
                variant="link"
                onClick={() => { setIsAdding(true); }}
                className="mt-2 text-cyan-700"
              >
                Add your first stat
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
