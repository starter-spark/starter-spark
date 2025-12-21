"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, Copy, Check } from "lucide-react"
import { generateLicenses } from "../actions"

interface GenerateLicensesFormProps {
  products: { id: string; name: string }[]
}

export function GenerateLicensesForm({ products }: GenerateLicensesFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Form state
  const [productId, setProductId] = useState(products[0]?.id || "")
  const [quantity, setQuantity] = useState(1)
  const [source, setSource] = useState<"online_purchase" | "physical_card">("physical_card")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setGeneratedCodes([])

    startTransition(async () => {
      const result = await generateLicenses(productId, quantity, source)

      if (result.error) {
        setError(result.error)
      } else {
        setGeneratedCodes(result.codes)
      }
    })
  }

  const handleCopyCode = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code)
    setCopiedIndex(index)
    setTimeout(() => { setCopiedIndex(null); }, 2000)
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(generatedCodes.join("\n"))
    alert("All codes copied to clipboard!")
  }

  const handleDownloadCSV = () => {
    const product = products.find((p) => p.id === productId)
    const csv = [
      "Code,Product,Source",
      ...generatedCodes.map((code) =>
        `${code},"${product?.name || "Unknown"}",${source}`
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `licenses-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (generatedCodes.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Licenses Generated!</CardTitle>
          <CardDescription>
            {generatedCodes.length} license codes have been created
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void handleCopyAll()}>
              <Copy className="mr-2 h-4 w-4" />
              Copy All
            </Button>
            <Button variant="outline" onClick={() => { handleDownloadCSV(); }}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </div>

          <div className="max-h-96 space-y-2 overflow-auto rounded border border-slate-200 p-4">
            {generatedCodes.map((code, index) => (
              <div
                key={code}
                className="flex items-center justify-between rounded bg-slate-50 p-2"
              >
                <code className="font-mono text-sm">{code}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleCopyCode(code, index)}
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setGeneratedCodes([])
                setQuantity(1)
              }}
            >
              Generate More
            </Button>
            <Button
              className="bg-cyan-700 hover:bg-cyan-600"
              onClick={() => { router.push("/admin/licenses"); }}
            >
              View All Licenses
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={(e) => { handleSubmit(e); }} className="space-y-6">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>License Details</CardTitle>
          <CardDescription>
            Select the product and quantity of licenses to generate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="product" className="text-sm font-medium text-slate-900">
              Product
            </label>
            <select
              id="product"
              value={productId}
              onChange={(e) => { setProductId(e.target.value); }}
              required
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium text-slate-900">
                Quantity
              </label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => { setQuantity(Number.parseInt(e.target.value) || 1); }}
                required
              />
              <p className="text-xs text-slate-500">Max 100 per batch</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="source" className="text-sm font-medium text-slate-900">
                Source
              </label>
              <select
                id="source"
                value={source}
                onChange={(e) =>
                  { setSource(e.target.value as "online_purchase" | "physical_card"); }
                }
                required
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-700 focus:ring-offset-2"
              >
                <option value="physical_card">Physical Card</option>
                <option value="online_purchase">Online Purchase</option>
              </select>
              <p className="text-xs text-slate-500">
                Physical cards are typically for retail distribution
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => { router.push("/admin/licenses"); }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-cyan-700 hover:bg-cyan-600"
          disabled={isPending || !productId}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Generate {quantity} License{quantity > 1 ? "s" : ""}
        </Button>
      </div>
    </form>
  )
}
