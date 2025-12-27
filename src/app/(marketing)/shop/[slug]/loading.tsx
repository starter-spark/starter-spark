import { LoadingBlock } from '@/components/loading'

export default function ProductLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-24 pb-4 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <LoadingBlock className="h-4 w-32" tone="soft" />
        </div>
      </section>

      <section className="pb-16 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="w-full lg:w-3/5 space-y-4">
              <div className="relative aspect-square bg-white rounded border border-slate-200 overflow-hidden">
                <LoadingBlock className="absolute inset-0" tone="soft" />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {Array.from({ length: 4 }, (_, i) => (
                  <LoadingBlock key={i} className="h-20 w-20 rounded" tone="soft" />
                ))}
              </div>
            </div>

            <div className="w-full lg:w-2/5">
              <div className="bg-white rounded border border-slate-200 shadow-md p-6 space-y-6">
                <div>
                  <LoadingBlock className="h-8 w-2/3 mb-2" tone="strong" />
                  <LoadingBlock className="h-5 w-24" tone="soft" />
                </div>
                <div className="space-y-2">
                  <LoadingBlock className="h-10 w-32" tone="strong" />
                  <LoadingBlock className="h-4 w-24" tone="soft" />
                </div>
                <div className="space-y-2">
                  <LoadingBlock className="h-4 w-20" tone="soft" />
                  <div className="flex items-center gap-3">
                    <LoadingBlock className="h-10 w-10 rounded" tone="soft" />
                    <LoadingBlock className="h-6 w-12" tone="soft" />
                    <LoadingBlock className="h-10 w-10 rounded" tone="soft" />
                  </div>
                </div>
                <LoadingBlock className="h-14 w-full" tone="strong" />
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <LoadingBlock className="h-4 w-4 rounded" tone="soft" />
                      <LoadingBlock className="h-4 w-40" tone="soft" />
                    </div>
                  ))}
                </div>
                <LoadingBlock className="h-16 w-full" tone="strong" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto pt-12">
          <div className="flex flex-wrap gap-3 mb-8">
            {Array.from({ length: 3 }, (_, i) => (
              <LoadingBlock key={i} className="h-9 w-28" tone="soft" />
            ))}
          </div>
          <div className="space-y-4">
            <LoadingBlock className="h-4 w-full" tone="soft" />
            <LoadingBlock className="h-4 w-11/12" tone="soft" />
            <LoadingBlock className="h-4 w-10/12" tone="soft" />
            <LoadingBlock className="h-36 w-full" tone="soft" />
          </div>
        </div>
      </section>
    </div>
  )
}
