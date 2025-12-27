'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ScrollText,
  User,
  Package,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

function formatTimeAgo(date: Date): string {
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
  return date.toLocaleDateString()
}

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
  user_email?: string
}

interface AuditLogViewerProps {
  logs: AuditLogEntry[]
}

const actionLabels: Record<string, string> = {
  'user.role_changed': 'Role Changed',
  'user.deleted': 'User Deleted',
  'product.created': 'Product Created',
  'product.updated': 'Product Updated',
  'product.deleted': 'Product Deleted',
  'license.created': 'License Created',
  'license.revoked': 'License Revoked',
  'license.transferred': 'License Transferred',
  'event.created': 'Event Created',
  'event.updated': 'Event Updated',
  'event.deleted': 'Event Deleted',
  'post.deleted': 'Post Deleted',
  'post.status_changed': 'Post Status Changed',
  'comment.deleted': 'Comment Deleted',
  'comment.verified': 'Comment Verified',
  'settings.updated': 'Settings Updated',
  'stats.updated': 'Stats Updated',
}

const resourceIcons: Record<string, typeof User> = {
  user: User,
  product: Package,
  license: FileText,
  event: Calendar,
  post: MessageSquare,
  comment: MessageSquare,
  settings: Settings,
  stats: Settings,
}

const actionColors: Record<string, string> = {
  'user.role_changed': 'bg-purple-100 text-purple-700',
  'user.deleted': 'bg-red-100 text-red-700',
  'product.created': 'bg-green-100 text-green-700',
  'product.updated': 'bg-blue-100 text-blue-700',
  'product.deleted': 'bg-red-100 text-red-700',
  'license.created': 'bg-green-100 text-green-700',
  'license.revoked': 'bg-red-100 text-red-700',
  'post.deleted': 'bg-red-100 text-red-700',
  'post.status_changed': 'bg-amber-100 text-amber-700',
  'comment.deleted': 'bg-red-100 text-red-700',
  'comment.verified': 'bg-green-100 text-green-700',
  'event.created': 'bg-green-100 text-green-700',
  'event.updated': 'bg-blue-100 text-blue-700',
  'event.deleted': 'bg-red-100 text-red-700',
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredLogs =
    filter === 'all' ? logs : logs.filter((log) => log.resource_type === filter)

  const resourceTypes = [...new Set(logs.map((log) => log.resource_type))]

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Audit Log
          </CardTitle>
          <CardDescription>Track admin actions and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ScrollText className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-600">No audit logs yet</p>
            <p className="text-sm text-slate-500">
              Admin actions will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Audit Log
            </CardTitle>
            <CardDescription>Track admin actions and changes</CardDescription>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {resourceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {filteredLogs.map((log) => {
            const Icon = resourceIcons[log.resource_type] || Settings
            const isExpanded = expandedId === log.id

            return (
              <div
                key={log.id}
                className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 mt-0.5">
                      <Icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={
                            actionColors[log.action] ||
                            'bg-slate-100 text-slate-700'
                          }
                        >
                          {actionLabels[log.action] || log.action}
                        </Badge>
                        {log.resource_id && (
                          <code className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {log.resource_id.slice(0, 8)}...
                          </code>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {log.user_email || log.user_id?.slice(0, 8) || 'System'}
                        {log.created_at && (
                          <span className="text-slate-400">
                            {' '}
                            • {formatTimeAgo(new Date(log.created_at))}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {log.details &&
                    typeof log.details === 'object' &&
                    !Array.isArray(log.details) &&
                    Object.keys(log.details).length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpandedId(isExpanded ? null : log.id)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                </div>

                {isExpanded && log.details && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <pre className="text-xs text-slate-600 bg-slate-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                    {log.ip_address && (
                      <p className="text-xs text-slate-400 mt-2">
                        IP: {log.ip_address}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
