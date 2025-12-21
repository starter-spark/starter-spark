"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ClaimResponse {
  message?: string
  error?: string
}

// Format code as XXXX-XXXX-XXXX-XXXX
function formatCode(value: string): string {
  // Strip everything except alphanumeric, convert to uppercase
  const stripped = value.replaceAll(/[^A-Za-z0-9]/g, "").toUpperCase()
  // Limit to 16 characters (4 groups of 4)
  const limited = stripped.slice(0, 16)
  // Add dashes every 4 characters
  const parts = limited.match(/.{1,4}/g) || []
  return parts.join("-")
}

export function ClaimCodeForm() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(formatCode(e.target.value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code.trim()) return

    setIsLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      const response = await fetch("/api/claim-license", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      })

      const data = (await response.json()) as ClaimResponse

      if (response.ok) {
        setStatus("success")
        setMessage(data.message ?? "Kit claimed successfully!")
        setCode("")
        // Refresh the page to show the new kit
        router.refresh()
      } else {
        setStatus("error")
        setMessage(data.error ?? "Failed to claim kit. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      <Input
        type="text"
        placeholder="XXXX-XXXX-XXXX-XXXX"
        value={code}
        onChange={handleCodeChange}
        className="font-mono text-center tracking-widest uppercase bg-slate-50 border-slate-200 focus:border-cyan-700"
        maxLength={19}
        disabled={isLoading}
      />
      <Button
        type="submit"
        disabled={!code.trim() || isLoading}
        className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Claiming...
          </>
        ) : (
          "Activate"
        )}
      </Button>

      {status === "success" && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
          <CheckCircle className="w-4 h-4" />
          {message}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4" />
          {message}
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Find the code on your physical card or in your confirmation email.
      </p>
    </form>
  )
}
