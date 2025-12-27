import { LoadingBlock } from '@/components/loading'

export default function LoginLoading() {
  return (
    <div className="bg-slate-50">
      <section className="pt-32 pb-24 px-6 lg:px-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <LoadingBlock className="h-8 w-32 mx-auto mb-2" tone="strong" />
            <LoadingBlock className="h-4 w-48 mx-auto" tone="soft" />
          </div>

          <div className="bg-white rounded border border-slate-200 p-8 space-y-6">
            <div className="space-y-2">
              <LoadingBlock className="h-4 w-20" tone="soft" />
              <LoadingBlock className="h-10 w-full" tone="strong" />
            </div>
            <div className="space-y-2">
              <LoadingBlock className="h-4 w-24" tone="soft" />
              <LoadingBlock className="h-10 w-full" tone="strong" />
            </div>
            <LoadingBlock className="h-10 w-full" tone="strong" />
          </div>

          <LoadingBlock className="h-4 w-64 mx-auto mt-6" tone="soft" />
        </div>
      </section>
    </div>
  )
}
