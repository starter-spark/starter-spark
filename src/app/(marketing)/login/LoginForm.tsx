'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, CheckCircle } from 'lucide-react'

interface LoginFormProps {
  redirectTo?: string
  claimToken?: string
}

export function LoginForm({ redirectTo, claimToken }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorId = 'login-email-error'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Build the redirect URL
      const fallbackOrigin = globalThis.location.origin
      const envSiteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
      const baseOrigin = (() => {
        if (!envSiteUrl) return fallbackOrigin
        try {
          return new URL(envSiteUrl).origin
        } catch {
          return fallbackOrigin
        }
      })()
      let callbackUrl = `${baseOrigin}/auth/callback`

      // Add redirect params
      const params = new URLSearchParams()
      if (claimToken) {
        params.set('claim', claimToken)
      }
      if (redirectTo) {
        params.set('redirect', redirectTo)
      }

      if (params.toString()) {
        callbackUrl += `?${params.toString()}`
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: callbackUrl,
        },
      })

      if (signInError) {
        throw signInError
      }

      setIsSent(true)
    } catch (err) {
      console.error('Login error:', err)

      // Handle rate limit error with user-friendly message
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (errorMessage.includes('after')) {
        const seconds = /after (\d+) seconds?/.exec(errorMessage)?.[1]
        if (seconds) {
          setError(
            `Please wait ${seconds} seconds before requesting another link.`,
          )
        } else {
          setError('Please wait a moment before requesting another link.')
        }
      } else {
        setError('Failed to send magic link. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="font-mono text-xl text-slate-900 mb-2">
          Check your email
        </h2>
        <p className="text-slate-600 mb-4">
          We sent a magic link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-slate-600">
          Click the link in the email to sign in. The link expires in 1 hour.
        </p>
        <button
          onClick={() => {
            setIsSent(false)
            setEmail('')
          }}
          className="mt-6 text-sm text-cyan-700 hover:text-cyan-600"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-mono text-slate-700 mb-2"
        >
          Email address
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600"
            aria-hidden="true"
          />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            className="pl-10 bg-slate-50 border-slate-200 focus:border-cyan-700"
            disabled={isLoading}
            required
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
      </div>

      {error && (
        <div
          id={errorId}
          role="alert"
          className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            Sending...
          </>
        ) : (
          'Send Magic Link'
        )}
      </Button>
    </form>
  )
}
