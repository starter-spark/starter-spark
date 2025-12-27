'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Ban,
  Loader2,
  Shield,
  Trash2,
  UserCog,
} from 'lucide-react'
import { updateProfile, deleteAccount } from './actions'
import { AvatarUpload } from './AvatarUpload'

interface AccountSettingsProps {
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    avatar_seed: string | null
    role: string
    is_banned_from_forums: boolean
    ban_reason: string | null
    created_at: string
  }
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      router.refresh()
    }

    setIsUpdating(false)
  }

  const handleAvatarUpdate = () => {
    router.refresh()
  }

  const handleAvatarMessage = (msg: {
    type: 'success' | 'error'
    text: string
  }) => {
    setMessage(msg)
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you absolutely sure you want to delete your account? This action cannot be undone. All your data, including licenses, progress, and forum posts will be permanently deleted.',
    )

    if (!confirmed) return

    const doubleConfirmed = confirm(
      "This is your final warning. Type 'DELETE' in the next prompt to confirm.",
    )

    if (!doubleConfirmed) return

    const typed = prompt('Type DELETE to confirm account deletion:')
    if (typed !== 'DELETE') {
      setMessage({ type: 'error', text: 'Account deletion cancelled.' })
      return
    }

    setIsDeleting(true)
    setMessage(null)

    const result = await deleteAccount()

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
      setIsDeleting(false)
    } else if (result?.success) {
      // Account deleted successfully, force full page reload to clear state.
      window.location.href = '/'
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Ban Warning */}
      {user.is_banned_from_forums && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Ban className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">
                  Your account has been restricted
                </p>
                <p className="text-sm text-red-700 mt-1">
                  You are currently banned from participating in the community
                  forums.
                  {user.ban_reason && (
                    <span className="block mt-1">
                      Reason: {user.ban_reason}
                    </span>
                  )}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  You can still access your workshop lessons and manage your
                  account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your public profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => void handleUpdateProfile(e)}
            className="space-y-6"
          >
            {/* Avatar Section */}
            <AvatarUpload
              user={{
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                avatar_seed: user.avatar_seed,
              }}
              onUpdate={handleAvatarUpdate}
              onMessage={handleAvatarMessage}
            />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Display Name</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={user.full_name || ''}
                placeholder="Your name"
                maxLength={100}
              />
              <p className="text-xs text-slate-500">
                This is how your name appears on forum posts and comments.
              </p>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-slate-50"
              />
              <p className="text-xs text-slate-500">
                Contact support to change your email address.
              </p>
            </div>

            {/* Role Badge */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    user.role === 'admin'
                      ? 'border-purple-300 text-purple-700'
                      : user.role === 'staff'
                        ? 'border-cyan-300 text-cyan-700'
                        : 'border-slate-300 text-slate-700'
                  }
                >
                  {user.role === 'admin' && <Shield className="mr-1 h-3 w-3" />}
                  {user.role === 'staff' && (
                    <UserCog className="mr-1 h-3 w-3" />
                  )}
                  {user.role === 'admin'
                    ? 'Administrator'
                    : user.role === 'staff'
                      ? 'Staff'
                      : 'Member'}
                </Badge>
                <span className="text-xs text-slate-500">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="bg-cyan-700 hover:bg-cyan-600"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Delete Account</p>
              <p className="text-sm text-slate-500">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => void handleDeleteAccount()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
