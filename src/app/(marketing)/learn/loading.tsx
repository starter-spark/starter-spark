import { LoadingBlock } from '@/components/loading'

export default function LearnLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <LoadingBlock className="h-4 w-20 rounded mb-2" tone="strong" />
          <LoadingBlock className="h-10 w-40 rounded mb-4" tone="strong" />
          <LoadingBlock className="h-6 w-96 rounded" tone="strong" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-[70%]">
              <div className="bg-white rounded border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <LoadingBlock className="h-6 w-24 rounded" tone="strong" />
                  <LoadingBlock className="h-4 w-12 rounded" tone="soft" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 2 }, (_, i) => (
                    <div
                      key={i}
                      className="p-4 border border-slate-200 rounded"
                    >
                      <LoadingBlock className="h-5 w-48 rounded mb-2" tone="strong" />
                      <LoadingBlock className="h-4 w-full rounded" tone="soft" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[30%] space-y-6">
              <div className="bg-white rounded border border-slate-200 p-6">
                <LoadingBlock className="h-6 w-28 rounded mb-4" tone="strong" />
                <LoadingBlock className="h-10 w-full rounded" tone="soft" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
