"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreHorizontal, Eye, Mail, CheckCircle, Clock, XCircle, Paperclip, FileImage, FileVideo, ExternalLink } from "lucide-react"

interface Attachment {
  name: string
  path: string
  size: number
  type: string
}

interface Submission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string | null
  created_at: string | null
  attachments: unknown // JSON from DB, we'll cast it
}

interface SupportActionsProps {
  submission: Submission
}

export function SupportActions({ submission }: SupportActionsProps) {
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [loadingUrls, setLoadingUrls] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Parse attachments from JSON
  const attachments: Attachment[] = Array.isArray(submission.attachments)
    ? (submission.attachments as Attachment[])
    : []

  // Fetch signed URLs when dialog opens
  const handleViewOpen = async () => {
    setIsViewOpen(true)

    if (attachments.length > 0 && Object.keys(signedUrls).length === 0) {
      setLoadingUrls(true)
      try {
        const urls: Record<string, string> = {}
        for (const attachment of attachments) {
          const { data } = await supabase.storage
            .from("contact-attachments")
            .createSignedUrl(attachment.path, 3600) // 1 hour expiry

          if (data?.signedUrl) {
            urls[attachment.path] = data.signedUrl
          }
        }
        setSignedUrls(urls)
      } catch (err) {
        console.error("Failed to get signed URLs:", err)
      } finally {
        setLoadingUrls(false)
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const updateStatus = async (newStatus: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ status: newStatus })
        .eq("id", submission.id)

      if (error) throw error
      router.refresh()
    } catch {
      console.error("Failed to update status")
    } finally {
      setIsLoading(false)
    }
  }

  const subjectLabels: Record<string, string> = {
    general: "General Inquiry",
    order: "Order Help",
    technical: "Technical Support",
    educator: "Educator Program",
    feedback: "Feedback",
    other: "Other",
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void handleViewOpen()}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`mailto:${submission.email}?subject=Re: ${submission.subject}`}>
              <Mail className="mr-2 h-4 w-4" />
              Reply via Email
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => void updateStatus("pending")}
            disabled={(submission.status || "pending") === "pending"}
          >
            <Clock className="mr-2 h-4 w-4 text-amber-500" />
            Mark Pending
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void updateStatus("in_progress")}
            disabled={(submission.status || "pending") === "in_progress"}
          >
            <Clock className="mr-2 h-4 w-4 text-cyan-500" />
            Mark In Progress
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void updateStatus("resolved")}
            disabled={(submission.status || "pending") === "resolved"}
          >
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Mark Resolved
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void updateStatus("closed")}
            disabled={(submission.status || "pending") === "closed"}
          >
            <XCircle className="mr-2 h-4 w-4 text-slate-500" />
            Close
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Submission</DialogTitle>
            <DialogDescription>
              {subjectLabels[submission.subject] || submission.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">From</p>
                <p className="text-slate-900">{submission.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Email</p>
                <a
                  href={`mailto:${submission.email}`}
                  className="text-cyan-700 hover:underline"
                >
                  {submission.email}
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Received</p>
              <p className="text-slate-900">
                {submission.created_at
                  ? new Date(submission.created_at).toLocaleString()
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Message</p>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-slate-700 whitespace-pre-wrap">{submission.message}</p>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({attachments.length})
                </p>
                <div className="space-y-2">
                  {loadingUrls ? (
                    <p className="text-sm text-slate-500">Loading attachments...</p>
                  ) : (
                    attachments.map((attachment, index) => {
                      const isImage = attachment.type.startsWith("image/")
                      const isVideo = attachment.type.startsWith("video/")
                      const signedUrl = signedUrls[attachment.path]

                      return (
                        <div
                          key={index}
                          className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
                        >
                          {/* Preview for images */}
                          {isImage && signedUrl && (
                            <div className="relative aspect-video bg-slate-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={signedUrl}
                                alt={attachment.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}

                          {/* Video indicator */}
                          {isVideo && (
                            <div className="aspect-video bg-slate-100 flex items-center justify-center">
                              <FileVideo className="h-12 w-12 text-slate-400" />
                            </div>
                          )}

                          {/* File info */}
                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {isImage ? (
                                <FileImage className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                              ) : (
                                <FileVideo className="h-4 w-4 text-purple-600 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatFileSize(attachment.size)} · {attachment.type}
                                </p>
                              </div>
                            </div>
                            {signedUrl && (
                              <a
                                href={signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-cyan-700 hover:text-cyan-800 flex-shrink-0"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button asChild>
                <a href={`mailto:${submission.email}?subject=Re: ${submission.subject}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Reply via Email
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
