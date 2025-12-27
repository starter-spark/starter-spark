import { LoadingBlock } from '@/components/loading'

export default function DocsLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-12 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <LoadingBlock className="h-4 w-32 mb-2" tone="soft" />
          <LoadingBlock className="h-10 w-2/3 mb-4" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl mb-2" tone="soft" />
          <LoadingBlock className="h-5 w-5/6 max-w-xl mb-8" tone="soft" />

          <LoadingBlock className="h-12 w-full max-w-2xl mb-8" tone="strong" />

          <div className="flex flex-wrap gap-6">
            {Array.from({ length: 2 }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded border border-slate-200"
              >
                <LoadingBlock className="h-5 w-5 rounded" tone="soft" />
                <LoadingBlock className="h-4 w-24" tone="soft" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="bg-white rounded border border-slate-200 overflow-hidden p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <LoadingBlock className="h-12 w-12 rounded" tone="soft" />
                  <LoadingBlock className="h-5 w-5 rounded" tone="soft" />
                </div>
                <LoadingBlock className="h-5 w-2/3 mb-2" tone="strong" />
                <LoadingBlock className="h-4 w-full mb-2" tone="soft" />
                <LoadingBlock className="h-4 w-3/4 mb-4" tone="soft" />
                <LoadingBlock className="h-3 w-24" tone="soft" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="p-8 bg-white rounded border border-slate-200 text-center">
            <LoadingBlock className="h-7 w-64 mx-auto mb-3" tone="strong" />
            <LoadingBlock className="h-4 w-full max-w-xl mx-auto mb-2" tone="soft" />
            <LoadingBlock className="h-4 w-5/6 max-w-lg mx-auto mb-6" tone="soft" />
            <LoadingBlock className="h-11 w-48 mx-auto" tone="strong" />
          </div>
        </div>
      </section>
    </div>
  )
}
