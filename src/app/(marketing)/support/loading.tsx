import { LoadingBlock } from '@/components/loading'

export default function SupportLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-16 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <LoadingBlock className="h-4 w-32 mx-auto mb-4" tone="soft" />
          <LoadingBlock className="h-10 w-2/3 mx-auto mb-4" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl mx-auto" tone="soft" />
        </div>
      </section>

      <section className="pb-12 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-lg p-5"
              >
                <LoadingBlock className="h-10 w-10 rounded mb-3" tone="soft" />
                <LoadingBlock className="h-4 w-32 mb-2" tone="soft" />
                <LoadingBlock className="h-4 w-full" tone="soft" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-4xl mx-auto">
          <LoadingBlock className="h-8 w-56 mb-6" tone="strong" />
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-lg p-4"
              >
                <LoadingBlock className="h-5 w-2/3 mb-2" tone="strong" />
                <LoadingBlock className="h-4 w-1/2" tone="soft" />
              </div>
            ))}
          </div>

          <div className="mt-12 bg-cyan-50 border border-cyan-200 rounded-lg p-6 text-center">
            <LoadingBlock className="h-5 w-64 mx-auto mb-2" tone="accent" />
            <LoadingBlock className="h-4 w-full max-w-xl mx-auto mb-4" tone="accent" />
            <LoadingBlock className="h-9 w-40 mx-auto" tone="accent" />
          </div>
        </div>
      </section>
    </div>
  )
}
