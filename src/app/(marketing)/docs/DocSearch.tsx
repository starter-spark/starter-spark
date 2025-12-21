"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useDebouncedCallback } from "use-debounce"

interface SearchResult {
  id: string
  title: string
  excerpt: string | null
  slug: string
  category_slug: string
  category_name: string
  rank: number
}

export function DocSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const performSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const supabase = createClient()

    const { data, error } = await supabase.rpc("search_docs", {
      search_query: searchQuery,
      result_limit: 10,
    })

    if (error) {
      console.error("Search error:", error)
      setResults([])
    } else {
      setResults(data || [])
    }
    setIsSearching(false)
  }, 300)

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setQuery(value)
      setIsOpen(true)
      void performSearch(value)
    },
    [performSearch]
  )

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    setQuery("")
    setResults([])
    router.push(`/docs/${result.category_slug}/${result.slug}`)
  }

  const handleBlur = () => {
    // Delay closing to allow click events on results
    window.setTimeout(() => setIsOpen(false), 200)
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          onBlur={handleBlur}
          placeholder="Search documentation..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-slate-500">
              <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-cyan-700 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-slate-900 font-medium truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-cyan-700 mb-1">
                          {result.category_name}
                        </p>
                        {result.excerpt && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {result.excerpt}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
