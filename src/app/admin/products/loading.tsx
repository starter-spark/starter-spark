import { LoadingBlock } from '@/components/loading'

export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <LoadingBlock className="h-8 w-28" tone="strong" />
          <LoadingBlock className="mt-2 h-4 w-48" tone="soft" />
        </div>
        <LoadingBlock className="h-10 w-32" tone="strong" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-200">
          <div className="flex gap-4">
            {Array.from({ length: 5 }, (_, i) => (
              <LoadingBlock key={i} className="h-4 w-20" tone="soft" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LoadingBlock className="h-5 w-40" tone="soft" />
                <LoadingBlock className="h-4 w-4" tone="soft" />
              </div>
              <LoadingBlock className="h-6 w-28 rounded" tone="soft" />
              <LoadingBlock className="h-5 w-16" tone="soft" />
              <LoadingBlock className="h-6 w-20" tone="soft" />
              <LoadingBlock className="h-8 w-8" tone="soft" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
