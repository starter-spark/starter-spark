import { LoadingBlock } from '@/components/loading'

export default function CommunityPostLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-24 pb-4 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-4 w-40" tone="soft" />
        </div>
      </section>

      <section className="pb-8 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <article className="bg-white border border-slate-200 rounded p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="min-w-[40px] space-y-2">
                <LoadingBlock className="h-6 w-6 rounded" tone="soft" />
                <LoadingBlock className="h-3 w-8" tone="soft" />
                <LoadingBlock className="h-6 w-6 rounded" tone="soft" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <LoadingBlock className="h-6 w-20" tone="strong" />
                  <LoadingBlock className="h-4 w-24" tone="soft" />
                </div>
                <LoadingBlock className="h-8 w-3/4 mb-4" tone="strong" />
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <LoadingBlock key={i} className="h-6 w-20" tone="soft" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <LoadingBlock className="h-10 w-10 rounded-full" tone="soft" />
                  <LoadingBlock className="h-4 w-40" tone="soft" />
                </div>
              </div>
            </div>

            <div className="pl-14 space-y-3">
              <LoadingBlock className="h-4 w-full" tone="soft" />
              <LoadingBlock className="h-4 w-11/12" tone="soft" />
              <LoadingBlock className="h-4 w-10/12" tone="soft" />
              <LoadingBlock className="h-24 w-full" tone="soft" />
            </div>

            <div className="mt-6 pl-14 pt-4 border-t border-slate-100">
              <LoadingBlock className="h-8 w-32" tone="strong" />
            </div>
          </article>
        </div>
      </section>

      <section className="pb-8 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-6 w-40 mb-4" tone="strong" />
          <div className="space-y-4">
            {Array.from({ length: 2 }, (_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded p-6"
              >
                <div className="flex gap-4">
                  <div className="min-w-[40px] space-y-2">
                    <LoadingBlock className="h-5 w-5 rounded" tone="soft" />
                    <LoadingBlock className="h-3 w-8" tone="soft" />
                    <LoadingBlock className="h-5 w-5 rounded" tone="soft" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <LoadingBlock className="h-4 w-full mb-2" tone="soft" />
                    <LoadingBlock className="h-4 w-11/12 mb-2" tone="soft" />
                    <LoadingBlock className="h-4 w-10/12 mb-4" tone="soft" />
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <LoadingBlock className="h-8 w-8 rounded-full" tone="soft" />
                      <LoadingBlock className="h-4 w-40" tone="soft" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-6 w-32 mb-4" tone="strong" />
          <div className="bg-white border border-slate-200 rounded p-8 space-y-4">
            <LoadingBlock className="h-4 w-full" tone="soft" />
            <LoadingBlock className="h-4 w-11/12" tone="soft" />
            <LoadingBlock className="h-28 w-full" tone="soft" />
            <LoadingBlock className="h-10 w-32" tone="strong" />
          </div>
        </div>
      </section>
    </div>
  )
}
