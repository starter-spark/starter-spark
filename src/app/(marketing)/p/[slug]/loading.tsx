import { LoadingBlock } from '@/components/loading'

export default function CustomPageLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-12 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-10 w-2/3 mb-4" tone="strong" />
          <LoadingBlock className="h-4 w-40" tone="soft" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded border border-slate-200 p-8 lg:p-12 space-y-6">
            <div className="space-y-3">
              <LoadingBlock className="h-5 w-40" tone="strong" />
              <LoadingBlock className="h-4 w-full" tone="soft" />
              <LoadingBlock className="h-4 w-11/12" tone="soft" />
              <LoadingBlock className="h-4 w-10/12" tone="soft" />
            </div>

            <div className="space-y-3">
              <LoadingBlock className="h-5 w-32" tone="strong" />
              <LoadingBlock className="h-4 w-full" tone="soft" />
              <LoadingBlock className="h-4 w-5/6" tone="soft" />
            </div>

            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <LoadingBlock className="h-2 w-2 rounded-full" tone="strong" />
                  <LoadingBlock className="h-4 w-2/3" tone="soft" />
                </div>
              ))}
            </div>

            <LoadingBlock className="h-28 w-full" tone="soft" />

            <div className="space-y-3">
              <LoadingBlock className="h-4 w-11/12" tone="soft" />
              <LoadingBlock className="h-4 w-4/5" tone="soft" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
