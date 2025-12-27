'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  User,
  Package,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  BookOpen,
  Layers,
  Folder,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string | null
}

interface AuditLogTableProps {
  logs: AuditLogEntry[]
  userEmails: Record<string, string>
  currentPage: number
  totalPages: number
  filters: {
    resource: string
    action: string
  }
}

const resourceIcons = new Map<string, typeof User>([
  ['user', User],
  ['product', Package],
  ['license', FileText],
  ['event', Calendar],
  ['post', MessageSquare],
  ['comment', MessageSquare],
  ['content', FileText],
  ['settings', Settings],
  ['stats', Settings],
  ['page_content', FileText],
  ['site_content', FileText],
  ['course', BookOpen],
  ['module', Layers],
  ['lesson', FileText],
  ['doc_category', Folder],
  ['doc_page', FileText],
  ['team_member', User],
])

const actionDescriptions = new Map<
  string,
  { label: string; verb: string; color: string }
>([
  // User management
  [
    'user.role_changed',
    {
      label: 'Role Changed',
      verb: 'changed the role of',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
    },
  ],
  [
    'user.deleted',
    {
      label: 'User Deleted',
      verb: 'deleted user',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  // Product management
  [
    'product.created',
    {
      label: 'Product Created',
      verb: 'created product',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'product.updated',
    {
      label: 'Product Updated',
      verb: 'updated product',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'product.deleted',
    {
      label: 'Product Deleted',
      verb: 'deleted product',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'product.tags_updated',
    {
      label: 'Tags Updated',
      verb: 'updated tags on product',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  // License management
  [
    'license.created',
    {
      label: 'License Created',
      verb: 'created license',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'license.bulk_created',
    {
      label: 'Bulk Licenses',
      verb: 'bulk generated licenses for',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'license.revoked',
    {
      label: 'License Revoked',
      verb: 'revoked license',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'license.assigned',
    {
      label: 'License Assigned',
      verb: 'manually assigned license',
      color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    },
  ],
  [
    'license.transferred',
    {
      label: 'License Transferred',
      verb: 'transferred license',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
    },
  ],
  // Event management
  [
    'event.created',
    {
      label: 'Event Created',
      verb: 'created event',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'event.updated',
    {
      label: 'Event Updated',
      verb: 'updated event',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'event.deleted',
    {
      label: 'Event Deleted',
      verb: 'deleted event',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  // Community moderation
  [
    'post.deleted',
    {
      label: 'Post Deleted',
      verb: 'deleted post',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'post.status_changed',
    {
      label: 'Post Status Changed',
      verb: 'changed status of post',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
    },
  ],
  [
    'comment.deleted',
    {
      label: 'Comment Deleted',
      verb: 'deleted comment',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'comment.verified',
    {
      label: 'Comment Verified',
      verb: 'verified comment as answer on',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  // Content management
  [
    'content.created',
    {
      label: 'Page Created',
      verb: 'created page',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'content.updated',
    {
      label: 'Page Updated',
      verb: 'updated page',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'content.published',
    {
      label: 'Page Published',
      verb: 'published page',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'content.unpublished',
    {
      label: 'Page Unpublished',
      verb: 'unpublished page',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
    },
  ],
  [
    'content.deleted',
    {
      label: 'Page Deleted',
      verb: 'deleted page',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  // Site settings
  [
    'settings.updated',
    {
      label: 'Settings Updated',
      verb: 'updated settings',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'stats.created',
    {
      label: 'Stat Created',
      verb: 'created site stat',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'stats.updated',
    {
      label: 'Stat Updated',
      verb: 'updated site stat',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'stats.deleted',
    {
      label: 'Stat Deleted',
      verb: 'deleted site stat',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  // Site content
  [
    'site_content.updated',
    {
      label: 'Site Content Updated',
      verb: 'updated site content',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'site_content.reset',
    {
      label: 'Site Content Reset',
      verb: 'reset site content to default',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
    },
  ],
  // Learning management
  [
    'course.created',
    {
      label: 'Course Created',
      verb: 'created course',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'course.updated',
    {
      label: 'Course Updated',
      verb: 'updated course',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'course.deleted',
    {
      label: 'Course Deleted',
      verb: 'deleted course',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'module.created',
    {
      label: 'Module Created',
      verb: 'created module',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'module.updated',
    {
      label: 'Module Updated',
      verb: 'updated module',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'module.deleted',
    {
      label: 'Module Deleted',
      verb: 'deleted module',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'module.reordered',
    {
      label: 'Modules Reordered',
      verb: 'reordered modules for',
      color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    },
  ],
  [
    'lesson.created',
    {
      label: 'Lesson Created',
      verb: 'created lesson',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'lesson.updated',
    {
      label: 'Lesson Updated',
      verb: 'updated lesson',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'lesson.deleted',
    {
      label: 'Lesson Deleted',
      verb: 'deleted lesson',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'lesson.reordered',
    {
      label: 'Lessons Reordered',
      verb: 'reordered lessons for',
      color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    },
  ],
  // Docs management
  [
    'doc_category.created',
    {
      label: 'Doc Category Created',
      verb: 'created doc category',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'doc_category.updated',
    {
      label: 'Doc Category Updated',
      verb: 'updated doc category',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'doc_category.deleted',
    {
      label: 'Doc Category Deleted',
      verb: 'deleted doc category',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'doc_page.created',
    {
      label: 'Doc Page Created',
      verb: 'created doc page',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'doc_page.updated',
    {
      label: 'Doc Page Updated',
      verb: 'updated doc page',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'doc_page.deleted',
    {
      label: 'Doc Page Deleted',
      verb: 'deleted doc page',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'doc_page.published',
    {
      label: 'Doc Page Published',
      verb: 'published doc page',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'doc_page.unpublished',
    {
      label: 'Doc Page Unpublished',
      verb: 'unpublished doc page',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
    },
  ],
  // Team management
  [
    'team_member.created',
    {
      label: 'Team Member Created',
      verb: 'added team member',
      color: 'bg-green-100 text-green-700 border-green-200',
    },
  ],
  [
    'team_member.updated',
    {
      label: 'Team Member Updated',
      verb: 'updated team member',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  ],
  [
    'team_member.deleted',
    {
      label: 'Team Member Deleted',
      verb: 'removed team member',
      color: 'bg-red-100 text-red-700 border-red-200',
    },
  ],
  [
    'team_member.reordered',
    {
      label: 'Team Reordered',
      verb: 'reordered team members',
      color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    },
  ],
])

const resourceLinks = new Map<string, (id: string) => string>([
  ['user', (id) => `/admin/users?search=${id}`],
  ['product', (id) => `/admin/products/${id}`],
  ['license', (id) => `/admin/licenses?search=${id}`],
  ['event', (id) => `/admin/events/${id}`],
  ['post', (id) => `/admin/community?search=${id}`],
  ['comment', () => `/admin/community`],
  ['content', (id) => `/admin/content/${id}`],
  ['site_content', () => `/admin/content/site`],
  ['course', (id) => `/admin/learn/${id}`],
  ['module', () => `/admin/learn`],
  ['lesson', () => `/admin/learn`],
  ['doc_category', () => `/admin/docs/categories`],
  ['doc_page', (id) => `/admin/docs/${id}`],
  ['team_member', () => `/admin/content/team`],
])

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return ''
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void handleCopy()}
      className="h-6 w-6 p-0 hover:bg-slate-200"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 text-slate-400" />
      )}
    </Button>
  )
}

function DetailsSection({ details }: { details: Json | null }) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return null
  }

  const detailsObj = details as Record<string, Json | undefined>
  const keys = Object.keys(detailsObj)
  if (keys.length === 0) return null

  // Format specific change types
  const formatValue = (key: string, value: Json | undefined): string => {
    if (value === null || value === undefined) return 'none'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  // Check for before/after pattern
  const hasOldNew =
    'old' in detailsObj ||
    'new' in detailsObj ||
    'oldRole' in detailsObj ||
    'newRole' in detailsObj ||
    'oldStatus' in detailsObj ||
    'newStatus' in detailsObj

  if (hasOldNew) {
    const pairs: { label: string; old: string; new: string }[] = []

    if ('oldRole' in detailsObj && 'newRole' in detailsObj) {
      pairs.push({
        label: 'Role',
        old: formatValue('oldRole', detailsObj.oldRole),
        new: formatValue('newRole', detailsObj.newRole),
      })
    }
    if ('oldStatus' in detailsObj && 'newStatus' in detailsObj) {
      pairs.push({
        label: 'Status',
        old: formatValue('oldStatus', detailsObj.oldStatus),
        new: formatValue('newStatus', detailsObj.newStatus),
      })
    }
    if ('old' in detailsObj && 'new' in detailsObj) {
      pairs.push({
        label: 'Value',
        old: formatValue('old', detailsObj.old),
        new: formatValue('new', detailsObj.new),
      })
    }

    if (pairs.length > 0) {
      const excluded = new Set([
        'old',
        'new',
        'oldRole',
        'newRole',
        'oldStatus',
        'newStatus',
      ])
      const remainingEntries = Object.entries(detailsObj).filter(
        ([key]) => !excluded.has(key),
      )

      return (
        <div className="space-y-2">
          {pairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 w-16">{pair.label}:</span>
              <code className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">
                {pair.old}
              </code>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <code className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                {pair.new}
              </code>
            </div>
          ))}
          {/* Show remaining fields */}
          {remainingEntries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-sm">
              <span className="text-slate-500 w-16 capitalize">{key}:</span>
              <code className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                {formatValue(key, value)}
              </code>
            </div>
          ))}
        </div>
      )
    }
  }

  // Default: show all fields
  return (
    <div className="space-y-1">
      {Object.entries(detailsObj).map(([key, value]) => (
        <div key={key} className="flex items-start gap-2 text-sm">
          <span className="text-slate-500 capitalize min-w-[80px]">
            {key.replaceAll('_', ' ')}:
          </span>
          <code className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs break-all">
            {formatValue(key, value)}
          </code>
        </div>
      ))}
    </div>
  )
}

export function AuditLogTable({
  logs,
  userEmails,
  currentPage,
  totalPages,
  filters,
}: AuditLogTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page') // Reset to page 1 on filter change
    router.push(`/admin/audit?${params.toString()}`)
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/admin/audit?${params.toString()}`)
  }

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const allActions = [...new Set(logs.map((l) => l.action))]
  const allResources = [...new Set(logs.map((l) => l.resource_type))]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Resource:</span>
          <Select
            value={filters.resource}
            onValueChange={(v) => {
              updateFilter('resource', v)
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Resources</SelectItem>
              {allResources.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1).replaceAll('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Action:</span>
          <Select
            value={filters.action}
            onValueChange={(v) => {
              updateFilter('action', v)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {allActions.map((a) => (
                <SelectItem key={a} value={a}>
                  {actionDescriptions.get(a)?.label ?? a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Date & Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-slate-500"
                >
                  No audit logs found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const Icon = resourceIcons.get(log.resource_type) ?? Settings
                const actionInfo = actionDescriptions.get(log.action) ?? {
                  label: log.action,
                  verb: 'performed action on',
                  color: 'bg-slate-100 text-slate-700 border-slate-200',
                }
                const isExpanded = expandedRows.has(log.id)
                const hasDetails =
                  log.details &&
                  typeof log.details === 'object' &&
                  !Array.isArray(log.details) &&
                  Object.keys(log.details).length > 0
                const canExpand =
                  hasDetails || Boolean(log.ip_address || log.user_agent)
                const resourceLinkBuilder = resourceLinks.get(log.resource_type)
                const resourceLink =
                  log.resource_id && resourceLinkBuilder
                    ? resourceLinkBuilder(log.resource_id)
                    : null

                const detailsRowId = `audit-log-details-${log.id}`

                return [
                  <TableRow key={log.id} className="hover:bg-slate-50">
                    <TableCell>
                      {canExpand && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-expanded={isExpanded}
                          aria-controls={detailsRowId}
                          onClick={() => {
                            toggleRow(log.id)
                          }}
                        >
                          <ChevronDown
                            className={`h-4 w-4 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={actionInfo.color}>
                        {actionInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100">
                          <Icon className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-slate-900 capitalize">
                              {log.resource_type.replaceAll('_', ' ')}
                            </span>
                            {resourceLink && (
                              <Link
                                href={resourceLink}
                                className="text-cyan-600 hover:text-cyan-700"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                          {log.resource_id && (
                            <div className="flex items-center gap-1">
                              <code className="text-xs text-slate-500 font-mono">
                                {log.resource_id}
                              </code>
                              <CopyButton text={log.resource_id} />
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-slate-900">
                          {log.user_id
                            ? userEmails[log.user_id] || 'Unknown User'
                            : 'System'}
                        </p>
                        {log.user_id && (
                          <div className="flex items-center gap-1">
                            <code className="text-xs text-slate-400 font-mono">
                              {log.user_id.slice(0, 8)}...
                            </code>
                            <CopyButton text={log.user_id} />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-slate-900">
                          {formatDate(log.created_at)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatRelativeTime(log.created_at)}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>,
                  isExpanded && canExpand ? (
                    <TableRow
                      key={`${log.id}-details`}
                      id={detailsRowId}
                      className="bg-slate-50 hover:bg-slate-50"
                    >
                      <TableCell colSpan={5} className="py-4">
                        <div className="pl-12 space-y-4">
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">
                              {log.user_id
                                ? userEmails[log.user_id] || 'Unknown'
                                : 'System'}
                            </span>{' '}
                            {actionInfo.verb}{' '}
                            <code className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">
                              {log.resource_id || log.resource_type}
                            </code>
                          </p>

                          {hasDetails && (
                            <div className="bg-white rounded border border-slate-200 p-4">
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                                Change Details
                              </p>
                              <DetailsSection details={log.details} />
                            </div>
                          )}

                          {(log.ip_address || log.user_agent) && (
                            <div className="flex gap-6 text-xs text-slate-500">
                              {log.ip_address && (
                                <div className="flex items-center gap-1">
                                  <span>IP:</span>
                                  <code className="font-mono">
                                    {log.ip_address}
                                  </code>
                                </div>
                              )}
                              {log.user_agent && (
                                <div className="flex items-center gap-1 max-w-md truncate">
                                  <span>UA:</span>
                                  <code className="font-mono truncate">
                                    {log.user_agent}
                                  </code>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null,
                ]
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                goToPage(currentPage - 1)
              }}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                goToPage(currentPage + 1)
              }}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
