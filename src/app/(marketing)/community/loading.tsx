import { LoadingBlock } from '@/components/loading'

export default function CommunityLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <LoadingBlock className="h-4 w-20 rounded mb-2" tone="strong" />
          <LoadingBlock className="h-10 w-32 rounded mb-4" tone="strong" />
          <LoadingBlock className="h-6 w-[450px] max-w-full rounded" tone="strong" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full lg:w-64 space-y-6">
              <div className="bg-white rounded border border-slate-200 p-4">
                <LoadingBlock className="h-5 w-24 rounded mb-4" tone="strong" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <LoadingBlock
                      key={i}
                      className="h-8 w-full rounded"
                      tone="soft"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <LoadingBlock className="h-6 w-32 rounded" tone="strong" />
                <LoadingBlock className="h-10 w-36 rounded" tone="strong" />
              </div>

              <div className="space-y-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded border border-slate-200 p-4"
                  >
                    <div className="flex gap-4">
                      <LoadingBlock className="w-10 h-10 rounded-full" tone="soft" />
                      <div className="flex-1">
                        <LoadingBlock className="h-5 w-3/4 rounded mb-2" tone="strong" />
                        <LoadingBlock className="h-4 w-full rounded mb-2" tone="soft" />
                        <div className="flex gap-4">
                          <LoadingBlock className="h-3 w-20 rounded" tone="soft" />
                          <LoadingBlock className="h-3 w-16 rounded" tone="soft" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
