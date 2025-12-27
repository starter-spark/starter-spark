import { LoadingBlock } from '@/components/loading'

export default function PongLoading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-24 bg-slate-50">
      <div className="text-center max-w-2xl w-full space-y-6">
        <LoadingBlock className="h-12 w-64 mx-auto" tone="strong" />
        <LoadingBlock className="h-4 w-2/3 mx-auto" tone="soft" />
        <LoadingBlock className="aspect-[485/402] w-full rounded-md" tone="soft" />
        <div className="space-y-2">
          <LoadingBlock className="h-4 w-3/4 mx-auto" tone="soft" />
          <LoadingBlock className="h-4 w-2/3 mx-auto" tone="soft" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <LoadingBlock className="h-12 w-40" tone="strong" />
          <LoadingBlock className="h-12 w-40" tone="soft" />
        </div>
      </div>
    </div>
  )
}
