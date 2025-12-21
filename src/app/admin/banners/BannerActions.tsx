"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff, Copy } from "lucide-react"
import { deleteBanner, toggleBannerActive, duplicateBanner } from "./actions"

interface BannerActionsProps {
  bannerId: string
  isActive: boolean
}

export function BannerActions({ bannerId, isActive }: BannerActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteBanner(bannerId)
      router.refresh()
    } catch (error) {
      console.error("Failed to delete banner:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleToggle = async () => {
    setIsToggling(true)
    try {
      await toggleBannerActive(bannerId, !isActive)
      router.refresh()
    } catch (error) {
      console.error("Failed to toggle banner:", error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      await duplicateBanner(bannerId)
      router.refresh()
    } catch (error) {
      console.error("Failed to duplicate banner:", error)
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { router.push(`/admin/banners/${bannerId}`); }}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void handleDuplicate()} disabled={isDuplicating}>
            <Copy className="mr-2 h-4 w-4" />
            {isDuplicating ? "Duplicating..." : "Duplicate"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void handleToggle()} disabled={isToggling}>
            {isActive ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                {isToggling ? "Deactivating..." : "Deactivate"}
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                {isToggling ? "Activating..." : "Activate"}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => { setShowDeleteDialog(true); }}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this banner? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
