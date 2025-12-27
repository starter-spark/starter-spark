import { LoadingBlock } from '@/components/loading'

export default function AccountLoading() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <LoadingBlock className="h-7 w-48" tone="strong" />
        <LoadingBlock className="h-4 w-64 mt-2" tone="soft" />

        <div className="mt-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <LoadingBlock className="h-5 w-24 mb-2" tone="strong" />
            <LoadingBlock className="h-4 w-48 mb-6" tone="soft" />
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <LoadingBlock className="h-20 w-20 rounded-full" tone="soft" />
                <div className="space-y-2">
                  <LoadingBlock className="h-4 w-32" tone="soft" />
                  <LoadingBlock className="h-4 w-24" tone="soft" />
                </div>
              </div>
              <div className="space-y-2">
                <LoadingBlock className="h-4 w-24" tone="soft" />
                <LoadingBlock className="h-10 w-full" tone="strong" />
                <LoadingBlock className="h-3 w-3/4" tone="soft" />
              </div>
              <div className="space-y-2">
                <LoadingBlock className="h-4 w-16" tone="soft" />
                <LoadingBlock className="h-10 w-full" tone="strong" />
                <LoadingBlock className="h-3 w-2/3" tone="soft" />
              </div>
              <LoadingBlock className="h-10 w-40" tone="strong" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <LoadingBlock className="h-5 w-32 mb-2" tone="strong" />
            <LoadingBlock className="h-4 w-48 mb-6" tone="soft" />
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <LoadingBlock className="h-4 w-32" tone="soft" />
                <LoadingBlock className="h-3 w-56" tone="soft" />
              </div>
              <LoadingBlock className="h-9 w-28" tone="strong" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
