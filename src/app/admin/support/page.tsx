import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  Paperclip,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { SupportActions } from './SupportActions'

export const metadata = {
  title: 'Support | Admin',
}

async function getContactSubmissions() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching contact submissions:', error)
    return []
  }

  return data
}

export default async function SupportPage() {
  const submissions = await getContactSubmissions()

  // Calculate stats
  const totalSubmissions = submissions.length
  const pendingSubmissions = submissions.filter(
    (s) => s.status === 'pending',
  ).length
  const resolvedSubmissions = submissions.filter(
    (s) => s.status === 'resolved',
  ).length

  const subjectLabels: Record<string, string> = {
    general: 'General',
    order: 'Order Help',
    technical: 'Technical',
    educator: 'Educator',
    feedback: 'Feedback',
    other: 'Other',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-cyan-100 text-cyan-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-slate-900">Support</h1>
        <p className="text-slate-600">
          Contact form submissions and support tickets
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2">
              <MessageSquare className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Messages</p>
              <p className="font-mono text-2xl font-bold text-slate-900">
                {totalSubmissions}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="font-mono text-2xl font-bold text-amber-600">
                {pendingSubmissions}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Resolved</p>
              <p className="font-mono text-2xl font-bold text-green-600">
                {resolvedSubmissions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <Mail className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-600">No contact submissions yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[60px]">Files</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                    {submission.created_at
                      ? formatRelativeTime(submission.created_at)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">
                        {submission.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {submission.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {subjectLabels[submission.subject] || submission.subject}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="truncate text-sm text-slate-600">
                      {submission.message}
                    </p>
                  </TableCell>
                  <TableCell>
                    {submission.attachments &&
                    Array.isArray(submission.attachments) &&
                    submission.attachments.length > 0 ? (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm">
                          {submission.attachments.length}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        statusColors[submission.status || 'pending'] ||
                        statusColors.pending
                      }
                    >
                      {submission.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <SupportActions submission={submission} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
