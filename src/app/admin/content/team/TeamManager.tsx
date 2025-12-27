'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  User,
  Github,
  Linkedin,
  Twitter,
  Loader2,
} from 'lucide-react'
import {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
} from './actions'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string | null
  image_url: string | null
  social_links: {
    github?: string
    linkedin?: string
    twitter?: string
  } | null
  sort_order: number
  is_active: boolean
  created_at: string
}

interface TeamManagerProps {
  initialMembers: TeamMember[]
}

const EMPTY_FORM = {
  name: '',
  role: '',
  bio: '',
  image_url: '',
  social_links: { github: '', linkedin: '', twitter: '' },
  is_active: true,
}

export function TeamManager({ initialMembers }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const openCreateDialog = () => {
    setEditingMember(null)
    setFormData(EMPTY_FORM)
    setIsDialogOpen(true)
  }

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio || '',
      image_url: member.image_url || '',
      social_links: {
        github: member.social_links?.github || '',
        linkedin: member.social_links?.linkedin || '',
        twitter: member.social_links?.twitter || '',
      },
      is_active: member.is_active,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.role) return

    setIsSubmitting(true)

    const data = {
      name: formData.name,
      role: formData.role,
      bio: formData.bio,
      image_url: formData.image_url,
      social_links: {
        ...(formData.social_links.github && {
          github: formData.social_links.github,
        }),
        ...(formData.social_links.linkedin && {
          linkedin: formData.social_links.linkedin,
        }),
        ...(formData.social_links.twitter && {
          twitter: formData.social_links.twitter,
        }),
      },
      is_active: formData.is_active,
    }

    if (editingMember) {
      const result = await updateTeamMember(editingMember.id, data)
      if (result.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, ...data } : m)),
        )
      }
    } else {
      const result = await createTeamMember(data)
      if (result.success && result.member) {
        const newMember: TeamMember = {
          id: result.member.id,
          name: result.member.name,
          role: result.member.role,
          bio: result.member.bio,
          image_url: result.member.image_url,
          social_links: result.member
            .social_links as TeamMember['social_links'],
          sort_order: result.member.sort_order ?? 0,
          is_active: result.member.is_active ?? true,
          created_at: result.member.created_at ?? new Date().toISOString(),
        }
        setMembers((prev) => [...prev, newMember])
      }
    }

    setIsSubmitting(false)
    setIsDialogOpen(false)
  }

  const handleDelete = async () => {
    if (!deletingMember) return

    setIsSubmitting(true)
    const result = await deleteTeamMember(deletingMember.id)

    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id))
    }

    setIsSubmitting(false)
    setIsDeleteDialogOpen(false)
    setDeletingMember(null)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newMembers = [...members]
    const [removed] = newMembers.splice(draggedIndex, 1)
    newMembers.splice(index, 0, removed)
    setMembers(newMembers)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex === null) return
    setDraggedIndex(null)

    // Save new order
    const orderedIds = members.map((m) => m.id)
    await reorderTeamMembers(orderedIds)
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={openCreateDialog}
          className="bg-cyan-700 hover:bg-cyan-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="space-y-3">
        {members.map((member, index) => (
          <Card
            key={member.id}
            draggable
            onDragStart={() => {
              handleDragStart(index)
            }}
            onDragOver={(e) => {
              handleDragOver(e, index)
            }}
            onDragEnd={() => void handleDragEnd()}
            className={`bg-white border-slate-200 cursor-move transition-all ${
              draggedIndex === index ? 'opacity-50 scale-[0.98]' : ''
            } ${member.is_active ? '' : 'opacity-60'}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-slate-400 flex-shrink-0" />

                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {member.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-medium text-slate-900 truncate">
                      {member.name}
                    </h3>
                    {!member.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 truncate">
                    {member.role}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {member.social_links?.github && (
                    <Github className="h-4 w-4 text-slate-400" />
                  )}
                  {member.social_links?.linkedin && (
                    <Linkedin className="h-4 w-4 text-slate-400" />
                  )}
                  {member.social_links?.twitter && (
                    <Twitter className="h-4 w-4 text-slate-400" />
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      openEditDialog(member)
                    }}
                    className="cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeletingMember(member)
                      setIsDeleteDialogOpen(true)
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {members.length === 0 && (
          <Card className="bg-white border-slate-200">
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600">No team members yet.</p>
              <p className="text-sm text-slate-500 mt-1">
                Click &quot;Add Member&quot; to create your first team profile.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </DialogTitle>
            <DialogDescription>
              {editingMember
                ? "Update the team member's profile information."
                : 'Add a new team member to display on the About page.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                  }}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value })
                  }}
                  placeholder="Software Engineer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => {
                  setFormData({ ...formData, bio: e.target.value })
                }}
                placeholder="A brief description of this team member..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Profile Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => {
                  setFormData({ ...formData, image_url: e.target.value })
                }}
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div className="space-y-3">
              <Label>Social Links</Label>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-slate-500" />
                  <Input
                    value={formData.social_links.github}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          github: e.target.value,
                        },
                      })
                    }}
                    placeholder="https://github.com/username"
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-slate-500" />
                  <Input
                    value={formData.social_links.linkedin}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          linkedin: e.target.value,
                        },
                      })
                    }}
                    placeholder="https://linkedin.com/in/username"
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-slate-500" />
                  <Input
                    value={formData.social_links.twitter}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        social_links: {
                          ...formData.social_links,
                          twitter: e.target.value,
                        },
                      })
                    }}
                    placeholder="https://twitter.com/username"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Show on About page</Label>
                <p className="text-sm text-slate-500">
                  Hide this member without deleting them
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => {
                  setFormData({ ...formData, is_active: checked })
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || !formData.name || !formData.role}
              className="bg-cyan-700 hover:bg-cyan-600"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingMember?.name}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
