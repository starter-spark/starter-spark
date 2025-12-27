import { LoadingBlock } from '@/components/loading'

export default function SupportLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <LoadingBlock className="h-8 w-24" tone="strong" />
        <LoadingBlock className="mt-2 h-4 w-72" tone="soft" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <LoadingBlock className="h-9 w-9 rounded-lg" tone="soft" />
              <div>
                <LoadingBlock className="h-4 w-24" tone="soft" />
                <LoadingBlock className="mt-1 h-7 w-10" tone="strong" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            {Array.from({ length: 7 }, (_, i) => (
              <LoadingBlock key={i} className="h-4 w-16" tone="soft" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <LoadingBlock className="h-5 w-20" tone="soft" />
              <div>
                <LoadingBlock className="h-5 w-32" tone="soft" />
                <LoadingBlock className="mt-1 h-4 w-40" tone="soft" />
              </div>
              <LoadingBlock className="h-6 w-20" tone="soft" />
              <LoadingBlock className="h-5 w-48" tone="soft" />
              <LoadingBlock className="h-5 w-8" tone="soft" />
              <LoadingBlock className="h-6 w-20" tone="soft" />
              <LoadingBlock className="h-8 w-8" tone="soft" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
