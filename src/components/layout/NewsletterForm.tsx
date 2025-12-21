"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TechInput } from "@/components/ui/TechInput"
import { CheckCircle, Loader2 } from "lucide-react"

interface NewsletterResponse {
  message?: string
  error?: string
}

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setStatus("error")
      setMessage("Please enter your email address")
      return
    }

    setStatus("loading")
    setMessage("")

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = (await response.json()) as NewsletterResponse

      if (!response.ok) {
        setStatus("error")
        setMessage(data.error ?? "Something went wrong")
        return
      }

      setStatus("success")
      setMessage(data.message ?? "Subscribed successfully!")
      setEmail("")

      // Reset after 5 seconds
      setTimeout(() => {
        setStatus("idle")
        setMessage("")
      }, 5000)
    } catch {
      setStatus("error")
      setMessage("Network error. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 rounded border border-green-200">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        <p className="text-sm">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      <div>
        <label htmlFor="newsletter-email" className="sr-only">
          Email address for newsletter
        </label>
        <TechInput
          id="newsletter-email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); }}
          className="h-10 bg-slate-50 text-sm"
          disabled={status === "loading"}
          aria-describedby={status === "error" && message ? "newsletter-error" : undefined}
        />
      </div>
      {status === "error" && message && (
        <p id="newsletter-error" role="alert" className="text-xs text-red-500">{message}</p>
      )}
      <Button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-sm disabled:opacity-50"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Subscribing...
          </>
        ) : (
          "Subscribe"
        )}
      </Button>
    </form>
  )
}
