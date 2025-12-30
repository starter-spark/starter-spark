'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import {
  MoreHorizontal,
  Shield,
  UserCog,
  User,
  Loader2,
  Ban,
  UserCheck,
} from 'lucide-react'
import {
  updateUserRole,
  banUserFromForums,
  unbanUserFromForums,
} from './actions'

interface UserActionsProps {
  userId: string
  currentRole: string | null
  isBanned?: boolean | null
}

type PendingAction =
  | { type: 'role'; role: 'admin' | 'staff' | 'user' }
  | { type: 'ban' }
  | { type: 'unban' }
  | null

export function UserActions({
  userId,
  currentRole,
  isBanned,
}: UserActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [banReason, setBanReason] = useState('')

  const handleRoleChangeConfirm = async (newRole: 'admin' | 'staff' | 'user') => {
    setPendingAction(null)
    setIsLoading(true)
    const result = await updateUserRole(userId, newRole)

    if (result.error) {
      toast.error('Failed to update role', { description: result.error })
    } else {
      toast.success('User role updated')
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleBanConfirm = async () => {
    setPendingAction(null)
    setIsLoading(true)
    const result = await banUserFromForums(userId, banReason || undefined)

    if (result.error) {
      toast.error('Failed to ban user', { description: result.error })
    } else {
      toast.success('User banned from forums')
      router.refresh()
    }

    setBanReason('')
    setIsLoading(false)
  }

  const handleUnbanConfirm = async () => {
    setPendingAction(null)
    setIsLoading(true)
    const result = await unbanUserFromForums(userId)

    if (result.error) {
      toast.error('Failed to unban user', { description: result.error })
    } else {
      toast.success('User unbanned from forums')
      router.refresh()
    }

    setIsLoading(false)
  }

  // Can't ban/unban admins or staff
  const canModifyBanStatus = currentRole !== 'admin' && currentRole !== 'staff'

  const getDialogContent = () => {
    if (!pendingAction) return null

    if (pendingAction.type === 'role') {
      const role = pendingAction.role
      if (role === 'admin') {
        return {
          title: 'Make this user an admin?',
          description:
            'This user will have full access to all admin features including user management, content moderation, and system settings.',
          action: 'Make Admin',
          variant: 'default' as const,
        }
      }
      if (role === 'staff') {
        return {
          title: 'Make this user a staff member?',
          description:
            'This user will have access to content moderation and customer support features.',
          action: 'Make Staff',
          variant: 'default' as const,
        }
      }
      return {
        title: 'Demote to regular user?',
        description:
          'This user will lose all admin/staff privileges and become a regular member.',
        action: 'Demote',
        variant: 'destructive' as const,
      }
    }

    if (pendingAction.type === 'ban') {
      return {
        title: 'Ban this user from forums?',
        description:
          'This user will no longer be able to create posts, comments, or vote in the community forums.',
        action: 'Ban User',
        variant: 'destructive' as const,
        showReasonInput: true,
      }
    }

    return {
      title: 'Unban this user?',
      description:
        'This user will be able to participate in the community forums again.',
      action: 'Unban',
      variant: 'default' as const,
    }
  }

  const dialogContent = getDialogContent()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setPendingAction({ type: 'role', role: 'admin' })}
            disabled={currentRole === 'admin'}
          >
            <Shield className="mr-2 h-4 w-4 text-purple-600" />
            Make Admin
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setPendingAction({ type: 'role', role: 'staff' })}
            disabled={currentRole === 'staff'}
          >
            <UserCog className="mr-2 h-4 w-4 text-cyan-600" />
            Make Staff
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setPendingAction({ type: 'role', role: 'user' })}
            disabled={currentRole === 'user'}
          >
            <User className="mr-2 h-4 w-4" />
            Make Regular User
          </DropdownMenuItem>
          {canModifyBanStatus && (
            <>
              <DropdownMenuSeparator />
              {isBanned ? (
                <DropdownMenuItem onClick={() => setPendingAction({ type: 'unban' })}>
                  <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                  Unban from Forums
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => setPendingAction({ type: 'ban' })}
                  className="text-red-600 focus:text-red-600"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Ban from Forums
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={!!pendingAction}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null)
            setBanReason('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingAction?.type === 'ban' && (
            <div className="py-2">
              <label
                htmlFor="ban-reason"
                className="text-sm font-medium text-slate-700"
              >
                Reason (optional)
              </label>
              <Textarea
                id="ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter a reason for the ban..."
                className="mt-1"
                rows={3}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAction?.type === 'role') {
                  void handleRoleChangeConfirm(pendingAction.role)
                } else if (pendingAction?.type === 'ban') {
                  void handleBanConfirm()
                } else if (pendingAction?.type === 'unban') {
                  void handleUnbanConfirm()
                }
              }}
              className={
                dialogContent?.variant === 'destructive'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-cyan-700 hover:bg-cyan-600'
              }
            >
              {dialogContent?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
