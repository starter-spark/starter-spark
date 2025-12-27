import { LoadingBlock } from '@/components/loading'

export default function CommunityNewLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-24 pb-4 px-6 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <LoadingBlock className="h-4 w-40" tone="soft" />
        </div>
      </section>

      <section className="pb-24 px-6 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <LoadingBlock className="h-9 w-64 mb-2" tone="strong" />
          <LoadingBlock className="h-5 w-full max-w-2xl mb-8" tone="soft" />

          <div className="bg-white border border-slate-200 rounded p-6 space-y-6">
            <div className="space-y-2">
              <LoadingBlock className="h-4 w-24" tone="soft" />
              <LoadingBlock className="h-10 w-full" tone="strong" />
            </div>
            <div className="space-y-2">
              <LoadingBlock className="h-4 w-28" tone="soft" />
              <LoadingBlock className="h-10 w-full" tone="strong" />
            </div>
            <div className="space-y-2">
              <LoadingBlock className="h-4 w-20" tone="soft" />
              <LoadingBlock className="h-32 w-full" tone="soft" />
            </div>
            <div className="flex justify-end">
              <LoadingBlock className="h-10 w-36" tone="strong" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
