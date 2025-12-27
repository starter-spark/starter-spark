import { LoadingBlock } from '@/components/loading'

export default function PrivacyLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <LoadingBlock className="h-10 w-2/3 mb-8" tone="strong" />
          <div className="bg-white rounded border border-slate-200 p-8 space-y-4">
            <LoadingBlock className="h-4 w-full" tone="soft" />
            <LoadingBlock className="h-4 w-11/12" tone="soft" />
            <LoadingBlock className="h-4 w-10/12" tone="soft" />
            <LoadingBlock className="h-24 w-full" tone="soft" />
            <LoadingBlock className="h-4 w-5/6" tone="soft" />
            <LoadingBlock className="h-4 w-3/4" tone="soft" />
          </div>
          <LoadingBlock className="h-4 w-40 mx-auto mt-6" tone="soft" />
        </div>
      </section>
    </div>
  )
}
