import { LoadingBlock } from '@/components/loading'

export default function CheckoutSuccessLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded border border-slate-200 p-8 text-center">
            <LoadingBlock className="h-20 w-20 rounded-full mx-auto mb-6" tone="soft" />
            <LoadingBlock className="h-8 w-40 mx-auto mb-2" tone="strong" />
            <LoadingBlock className="h-4 w-64 mx-auto mb-8" tone="soft" />

            <div className="bg-slate-50 rounded border border-slate-200 p-6 mb-8 text-left">
              <LoadingBlock className="h-4 w-32 mb-4" tone="soft" />
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex justify-between mb-3 last:mb-0">
                  <LoadingBlock className="h-4 w-24" tone="soft" />
                  <LoadingBlock className="h-4 w-20" tone="soft" />
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-8">
              <LoadingBlock className="h-4 w-32 mx-auto" tone="soft" />
              {Array.from({ length: 2 }, (_, i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-50 rounded border border-slate-200 text-left"
                >
                  <div className="flex items-start gap-4">
                    <LoadingBlock className="h-5 w-5 rounded" tone="soft" />
                    <div className="space-y-2">
                      <LoadingBlock className="h-4 w-32" tone="soft" />
                      <LoadingBlock className="h-4 w-full" tone="soft" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50 rounded border border-amber-200 mb-8">
              <LoadingBlock className="h-4 w-full" tone="warning" />
              <LoadingBlock className="h-4 w-5/6 mt-2" tone="warning" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <LoadingBlock className="h-11 w-full" tone="strong" />
              <LoadingBlock className="h-11 w-full" tone="strong" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
