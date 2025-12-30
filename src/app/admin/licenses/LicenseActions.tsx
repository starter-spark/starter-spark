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
import { MoreHorizontal, UserX, Copy, Loader2 } from 'lucide-react'
import { revokeLicense } from './actions'

interface LicenseActionsProps {
  licenseId: string
  licenseCode: string
  isClaimed: boolean
}

export function LicenseActions({
  licenseId,
  licenseCode,
  isClaimed,
}: LicenseActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)

  const handleRevokeConfirm = async () => {
    setShowRevokeDialog(false)
    setIsLoading(true)
    const result = await revokeLicense(licenseId)

    if (result.error) {
      toast.error('Failed to revoke license', { description: result.error })
    } else {
      toast.success('License revoked')
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(licenseCode)
      toast.success('License code copied to clipboard')
    } catch {
      toast.error('Failed to copy license code')
    }
  }

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
          <DropdownMenuItem onClick={() => void handleCopyCode()}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Code
          </DropdownMenuItem>
          {isClaimed && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowRevokeDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <UserX className="mr-2 h-4 w-4" />
                Revoke License
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this license?</AlertDialogTitle>
            <AlertDialogDescription>
              The current owner will lose access to this product. The license
              code will become unclaimed and can be claimed again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleRevokeConfirm()}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
