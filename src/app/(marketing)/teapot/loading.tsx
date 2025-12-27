import { LoadingBlock } from '@/components/loading'

export default function TeapotLoading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-24 bg-slate-50">
      <div className="text-center max-w-lg space-y-6">
        <LoadingBlock className="h-24 w-40 mx-auto rounded" tone="soft" />
        <LoadingBlock className="h-16 w-32 mx-auto" tone="strong" />
        <LoadingBlock className="h-6 w-40 mx-auto" tone="soft" />
        <div className="space-y-2">
          <LoadingBlock className="h-4 w-full" tone="soft" />
          <LoadingBlock className="h-4 w-11/12" tone="soft" />
          <LoadingBlock className="h-3 w-2/3 mx-auto" tone="soft" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <LoadingBlock className="h-12 w-36" tone="strong" />
          <LoadingBlock className="h-12 w-36" tone="soft" />
        </div>
        <LoadingBlock className="h-3 w-3/4 mx-auto" tone="soft" />
        <LoadingBlock className="h-3 w-2/3 mx-auto" tone="soft" />
      </div>
    </div>
  )
}
