import { LoadingBlock } from '@/components/loading'

export default function EventsLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <LoadingBlock className="h-8 w-40 mx-auto mb-6" tone="strong" />
          <LoadingBlock className="h-10 w-2/3 mx-auto mb-4" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl mx-auto" tone="soft" />
        </div>
      </section>

      <section className="pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-8 w-48 mb-8" tone="strong" />
          <div className="relative">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="relative pl-8 pb-12 last:pb-0">
                <div className="absolute left-0 top-2 bottom-0 w-px bg-cyan-200" />
                <div className="absolute left-0 top-2 w-2 h-2 rounded-full -translate-x-[3px] bg-cyan-700" />
                <div className="bg-white border border-slate-200 rounded shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <LoadingBlock className="h-4 w-32" tone="soft" />
                      <LoadingBlock className="h-4 w-20" tone="soft" />
                    </div>
                    <LoadingBlock className="h-14 w-14 rounded" tone="soft" />
                  </div>
                  <LoadingBlock className="h-6 w-2/3 mb-2" tone="strong" />
                  <LoadingBlock className="h-4 w-full mb-4" tone="soft" />
                  <div className="flex flex-wrap gap-4">
                    <LoadingBlock className="h-4 w-24" tone="soft" />
                    <LoadingBlock className="h-4 w-28" tone="soft" />
                  </div>
                  <LoadingBlock className="h-4 w-32 mt-4" tone="soft" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-10 w-40" tone="strong" />
        </div>
      </section>
    </div>
  )
}
