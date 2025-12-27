import { LoadingBlock } from '@/components/loading'

export default function ClaimTokenLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <LoadingBlock className="h-20 w-20 rounded-full mx-auto mb-6" tone="soft" />
            <LoadingBlock className="h-7 w-40 mx-auto mb-2" tone="strong" />
            <LoadingBlock className="h-4 w-64 mx-auto" tone="soft" />
          </div>

          <div className="bg-white rounded border border-slate-200 p-6 mb-6">
            <LoadingBlock className="h-5 w-40 mb-2" tone="strong" />
            <LoadingBlock className="h-4 w-full mb-4" tone="soft" />
            <LoadingBlock className="h-6 w-40" tone="soft" />
          </div>

          <LoadingBlock className="h-11 w-full" tone="strong" />
          <LoadingBlock className="h-4 w-56 mx-auto mt-4" tone="soft" />
        </div>
      </section>
    </div>
  )
}
