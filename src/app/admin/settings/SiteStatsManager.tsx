"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Pencil, X, Plus, Trash2, RefreshCw } from "lucide-react"
import { updateSiteStat, createSiteStat, deleteSiteStat } from "./actions"

interface SiteStat {
  id: string
  key: string
  value: number
  label: string
  suffix: string | null
  is_auto_calculated: boolean | null
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

  // New stat form state
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState(0)
  const [newLabel, setNewLabel] = useState("")
  const [newSuffix, setNewSuffix] = useState("")
  const [newIsAuto, setNewIsAuto] = useState(false)

  const startEditing = (stat: SiteStat) => {
    setEditingId(stat.id)
    setEditValue(stat.value)
    setEditLabel(stat.label)
    setEditSuffix(stat.suffix || "")
    setError(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setError(null)
  }

  const handleUpdate = async (id: string) => {
    startTransition(async () => {
      const result = await updateSiteStat({
        id,
        value: editValue,
        label: editLabel,
        suffix: editSuffix,
      })

      if (result.error) {
        setError(result.error)
      } else {
        // Update local state
        setStats(
          stats.map((s) =>
            s.id === id
              ? { ...s, value: editValue, label: editLabel, suffix: editSuffix }
              : s
          )
        )
        setEditingId(null)
        setError(null)
      }
    })
  }

  const handleDelete = async (id: string) => {
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

  const handleCreate = async () => {
    if (!newKey.trim() || !newLabel.trim()) {
      setError("Key and label are required")
      return
    }

    startTransition(async () => {
      const result = await createSiteStat({
        key: newKey.toLowerCase().replace(/\s+/g, "_"),
        value: newValue,
        label: newLabel,
        suffix: newSuffix,
        is_auto_calculated: newIsAuto,
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
        setIsAdding(false)
        setError(null)
        // Note: Page will revalidate and show new stat
        window.location.reload()
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
            onClick={() => setIsAdding(true)}
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
                    onChange={(e) => setNewKey(e.target.value)}
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
                    onChange={(e) => setNewLabel(e.target.value)}
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
                    onChange={(e) => setNewValue(parseInt(e.target.value) || 0)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Suffix
                  </label>
                  <Input
                    value={newSuffix}
                    onChange={(e) => setNewSuffix(e.target.value)}
                    placeholder="+ or %"
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={newIsAuto}
                    onChange={(e) => setNewIsAuto(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-700"
                  />
                  Auto-calculated from database
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAdding(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
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
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex-1 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Label
                      </label>
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
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
                          setEditValue(parseInt(e.target.value) || 0)
                        }
                        className="text-sm"
                        disabled={stat.is_auto_calculated === true}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Suffix
                      </label>
                      <Input
                        value={editSuffix}
                        onChange={(e) => setEditSuffix(e.target.value)}
                        placeholder="+ or %"
                        className="text-sm"
                      />
                    </div>
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
                      onClick={() => handleUpdate(stat.id)}
                      disabled={isPending}
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
                          >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Auto
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(stat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(stat.id)}
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
                onClick={() => setIsAdding(true)}
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
