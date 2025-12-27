import { LoadingBlock } from '@/components/loading'

export default function LicensesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <LoadingBlock className="h-8 w-28" tone="strong" />
          <LoadingBlock className="mt-2 h-4 w-56" tone="soft" />
        </div>
        <LoadingBlock className="h-10 w-40" tone="strong" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <LoadingBlock key={i} className="h-9 w-20" tone="soft" />
          ))}
        </div>
        <LoadingBlock className="h-9 w-40" tone="soft" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <LoadingBlock key={i} className="h-4 w-20" tone="soft" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <LoadingBlock className="h-6 w-32 rounded" tone="soft" />
              <LoadingBlock className="h-5 w-28" tone="soft" />
              <div className="flex items-center gap-2">
                <LoadingBlock className="h-4 w-4 rounded-full" tone="soft" />
                <div>
                  <LoadingBlock className="h-5 w-32" tone="soft" />
                  <LoadingBlock className="mt-1 h-3 w-40" tone="soft" />
                </div>
              </div>
              <LoadingBlock className="h-6 w-16" tone="soft" />
              <LoadingBlock className="h-5 w-24" tone="soft" />
              <LoadingBlock className="h-8 w-8" tone="soft" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
