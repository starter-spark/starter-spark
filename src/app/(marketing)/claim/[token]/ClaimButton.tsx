'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  ActionStatusBanner,
  type ActionStatus,
} from '@/components/ui/action-status'

interface ClaimResponse {
  message?: string
  error?: string
}

interface ClaimButtonProps {
  token: string
}

export function ClaimButton({ token }: ClaimButtonProps) {
  const [status, setStatus] = useState<ActionStatus>('idle')
  const [message, setMessage] = useState<string | undefined>(undefined)
  const router = useRouter()
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    router.prefetch('/workshop')
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current)
      }
    }
  }, [router])

  const handleClaim = async () => {
    setStatus('pending')
    setMessage('Claiming your kit…')

    try {
      const response = await fetch('/api/claim-by-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = (await response.json()) as ClaimResponse

      if (response.ok) {
        setStatus('success')
        setMessage(data.message ?? 'Kit claimed. Redirecting to Workshop…')
        if (redirectTimer.current) {
          clearTimeout(redirectTimer.current)
        }
        redirectTimer.current = setTimeout(() => {
          router.push('/workshop?claimed=true')
        }, 1200)
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Failed to claim kit. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => void handleClaim()}
        disabled={status === 'pending'}
        className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
      >
        {status === 'pending' ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Claiming...
          </>
        ) : (
          'Claim Kit'
        )}
      </Button>
      <ActionStatusBanner status={status} message={message} />
    </div>
  )
}
