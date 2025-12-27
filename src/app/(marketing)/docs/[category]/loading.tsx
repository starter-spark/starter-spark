import { LoadingBlock } from '@/components/loading'

export default function DocCategoryLoading() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="pt-28 pb-4 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-4 w-48" tone="soft" />
        </div>
      </section>

      <section className="pb-8 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-4 w-40 mb-4" tone="soft" />
          <LoadingBlock className="h-9 w-2/3 mb-3" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl" tone="soft" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="group flex items-start gap-4 p-5 bg-white rounded border border-slate-200"
            >
              <LoadingBlock className="h-10 w-10 rounded" tone="soft" />
              <div className="flex-1 min-w-0">
                <LoadingBlock className="h-5 w-2/3 mb-2" tone="strong" />
                <LoadingBlock className="h-4 w-full mb-2" tone="soft" />
                <LoadingBlock className="h-3 w-32" tone="soft" />
              </div>
              <LoadingBlock className="h-5 w-5 rounded" tone="soft" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
