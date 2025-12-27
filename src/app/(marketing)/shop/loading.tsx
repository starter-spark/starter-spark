import { LoadingBlock } from '@/components/loading'

export default function ShopLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <LoadingBlock className="h-4 w-16 rounded mb-2" tone="strong" />
          <LoadingBlock className="h-10 w-48 rounded mb-4" tone="strong" />
          <LoadingBlock className="h-6 w-80 rounded" tone="strong" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="bg-white rounded border border-slate-200 overflow-hidden"
              >
                <LoadingBlock className="aspect-[4/3]" tone="soft" />
                <div className="p-6 space-y-3">
                  <LoadingBlock className="h-6 w-3/4 rounded" tone="strong" />
                  <LoadingBlock className="h-4 w-full rounded" tone="soft" />
                  <LoadingBlock className="h-4 w-2/3 rounded" tone="soft" />
                  <LoadingBlock className="h-8 w-24 rounded mt-4" tone="strong" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
