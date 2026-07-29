'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GripVertical, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteCmsEntry, reorderCmsEntries, saveCmsDraft } from '@/cms/actions'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CollectionEntry {
  key: string
  hasDraft: boolean
  isPublished: boolean
  updatedAt: string
  data: Record<string, unknown> | null
}

interface CmsCollectionListProps {
  type: string
  columns: { name: string; label: string }[]
  orderable: boolean
  defaultData: Record<string, unknown>
  entries: CollectionEntry[]
}

function fieldValue(
  data: Record<string, unknown> | null,
  name: string,
): unknown {
  if (!data) return undefined
  return Object.entries(data).find(([key]) => key === name)?.[1]
}

function renderCell(value: unknown): string {
  if (typeof value === 'boolean') return value ? '✓' : '—'
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return JSON.stringify(value)
}

export function CmsCollectionList({
  type,
  columns,
  orderable,
  defaultData,
  entries: initialEntries,
}: CmsCollectionListProps) {
  const router = useRouter()
  const [entries, setEntries] = useState<CollectionEntry[]>(initialEntries)
  const [listError, setListError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingEntry, setDeletingEntry] = useState<CollectionEntry | null>(
    null,
  )
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleCreate = async () => {
    setIsCreating(true)
    const result = await saveCmsDraft({
      type,
      key: null,
      data: defaultData,
      baseVersion: 0,
      note: 'Created from admin',
    })
    if (result.success && result.key) {
      router.push(`/admin/cms/${type}/${result.key}`)
      return
    }
    setIsCreating(false)
    setListError(result.error ?? 'Failed to create the entry')
  }

  const handleDelete = async () => {
    if (!deletingEntry) return

    setIsDeleting(true)
    const result = await deleteCmsEntry({ type, key: deletingEntry.key })
    if (result.success) {
      setEntries((prev) => prev.filter((e) => e.key !== deletingEntry.key))
      setListError(null)
      router.refresh()
    } else {
      setListError(result.error ?? 'Failed to delete the entry')
    }

    setIsDeleting(false)
    setIsDeleteDialogOpen(false)
    setDeletingEntry(null)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const next = [...entries]
    const [removed] = next.splice(draggedIndex, 1)
    next.splice(index, 0, removed)
    setEntries(next)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return
    setDraggedIndex(null)

    const result = await reorderCmsEntries({
      type,
      orderedKeys: entries.map((e) => e.key),
    })
    if (!result.success) {
      setListError(
        result.error ??
          'Failed to save the new order — refresh to see the saved state',
      )
    } else {
      setListError(null)
    }
  }

  return (
    <>
      {listError && (
        <div
          role="alert"
          className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {listError}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => void handleCreate()}
          disabled={isCreating}
          className="bg-cyan-700 hover:bg-cyan-600"
        >
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">No entries yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Click &quot;New entry&quot; to create the first one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                {orderable && <TableHead className="w-[40px]" />}
                {columns.map((column) => (
                  <TableHead key={column.name}>{column.label}</TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow
                  key={entry.key}
                  draggable={orderable}
                  onDragStart={
                    orderable
                      ? () => {
                          handleDragStart(index)
                        }
                      : undefined
                  }
                  onDragOver={
                    orderable
                      ? (e) => {
                          handleDragOver(e, index)
                        }
                      : undefined
                  }
                  onDragEnd={orderable ? () => void handleDragEnd() : undefined}
                  className={
                    draggedIndex === index
                      ? 'opacity-50'
                      : orderable
                        ? 'cursor-move'
                        : undefined
                  }
                >
                  {orderable && (
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-slate-400" />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.name}>
                      <span className="text-sm text-slate-900">
                        {renderCell(fieldValue(entry.data, column.name))}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {entry.hasDraft && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200"
                        >
                          Draft
                        </Badge>
                      )}
                      {entry.isPublished && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Published
                        </Badge>
                      )}
                      {!entry.hasDraft && !entry.isPublished && (
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-600 border-slate-200"
                        >
                          Unpublished
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/cms/${type}/${entry.key}`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingEntry(entry)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? It will stop rendering
              on the site immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
