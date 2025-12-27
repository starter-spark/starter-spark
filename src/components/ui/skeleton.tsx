import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        // GPU-accelerated pulse animation
        'bg-accent animate-pulse rounded-md will-change-[opacity] transform-gpu',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
