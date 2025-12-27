import { LoadingBlock } from '@/components/loading'

export default function ContactLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <LoadingBlock className="h-4 w-24 mx-auto mb-4" tone="soft" />
          <LoadingBlock className="h-10 w-2/3 mx-auto mb-4" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl mx-auto" tone="soft" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 2 }, (_, i) => (
                    <div key={i} className="space-y-2">
                      <LoadingBlock className="h-4 w-20" tone="soft" />
                      <LoadingBlock className="h-10 w-full" tone="strong" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <LoadingBlock className="h-4 w-24" tone="soft" />
                  <LoadingBlock className="h-10 w-full" tone="strong" />
                </div>
                <div className="space-y-2">
                  <LoadingBlock className="h-4 w-24" tone="soft" />
                  <LoadingBlock className="h-32 w-full" tone="soft" />
                </div>
                <LoadingBlock className="h-10 w-32" tone="strong" />
              </div>
            </div>

            <div className="space-y-6">
              {Array.from({ length: 2 }, (_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-lg p-6"
                >
                  <LoadingBlock className="h-5 w-40 mb-4" tone="strong" />
                  <div className="space-y-4">
                    {Array.from({ length: 3 }, (_, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <LoadingBlock className="h-10 w-10 rounded" tone="soft" />
                        <div className="space-y-2">
                          <LoadingBlock className="h-4 w-24" tone="soft" />
                          <LoadingBlock className="h-4 w-40" tone="soft" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                <LoadingBlock className="h-5 w-40 mb-2" tone="accent" />
                <LoadingBlock className="h-4 w-full mb-4" tone="accent" />
                <LoadingBlock className="h-4 w-32" tone="accent" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
