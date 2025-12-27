import { LoadingBlock } from '@/components/loading'

export default function CartLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <LoadingBlock className="h-4 w-40 mb-4" tone="soft" />
          <LoadingBlock className="h-10 w-48" tone="strong" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="w-full lg:w-3/5">
              <div className="bg-white rounded border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                  <LoadingBlock className="h-4 w-24" tone="soft" />
                  <LoadingBlock className="h-4 w-20" tone="soft" />
                </div>
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 2 }, (_, i) => (
                    <div key={i} className="p-6 flex gap-6">
                      <LoadingBlock className="h-24 w-24 rounded" tone="soft" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <LoadingBlock className="h-4 w-40" tone="soft" />
                          <LoadingBlock className="h-6 w-6" tone="soft" />
                        </div>
                        <LoadingBlock className="h-4 w-20 mb-4" tone="soft" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <LoadingBlock className="h-8 w-8" tone="soft" />
                            <LoadingBlock className="h-4 w-10" tone="soft" />
                            <LoadingBlock className="h-8 w-8" tone="soft" />
                          </div>
                          <LoadingBlock className="h-4 w-16" tone="soft" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-2/5">
              <div className="bg-white rounded border border-slate-200 p-6 space-y-4">
                <LoadingBlock className="h-5 w-32" tone="strong" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <LoadingBlock className="h-4 w-24" tone="soft" />
                      <LoadingBlock className="h-4 w-16" tone="soft" />
                    </div>
                  ))}
                </div>
                <LoadingBlock className="h-10 w-full" tone="strong" />
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  {Array.from({ length: 2 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <LoadingBlock className="h-4 w-4 rounded" tone="soft" />
                      <LoadingBlock className="h-4 w-40" tone="soft" />
                    </div>
                  ))}
                </div>
                <LoadingBlock className="h-14 w-full" tone="strong" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
