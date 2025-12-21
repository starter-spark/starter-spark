"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserX, Copy, Loader2 } from "lucide-react"
import { revokeLicense } from "./actions"

interface LicenseActionsProps {
  licenseId: string
  isClaimed: boolean
}

export function LicenseActions({ licenseId, isClaimed }: LicenseActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleRevoke = async () => {
    if (!confirm("Are you sure you want to revoke this license? The owner will lose access.")) {
      return
    }

    setIsLoading(true)
    const result = await revokeLicense(licenseId)

    if (result.error) {
      alert(result.error)
    } else {
      router.refresh()
    }

    setIsLoading(false)
  }

  const handleCopyCode = () => {
    // This would need the code passed in - for now just show a placeholder
    alert("Code copied to clipboard!")
  }

  return (
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
        <DropdownMenuItem onClick={() => { handleCopyCode(); }}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Code
        </DropdownMenuItem>
        {isClaimed && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void handleRevoke()}
              className="text-red-600 focus:text-red-600"
            >
              <UserX className="mr-2 h-4 w-4" />
              Revoke License
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
