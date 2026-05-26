import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className, size = 'md' }: SkeletonProps) {
  const sizes = {
    sm: 'h-4 w-24',
    md: 'h-6 w-40',
    lg: 'h-8 w-64',
    full: 'h-full w-full',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-sand/50 rounded-xl',
        sizes[size],
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-ivory border border-sand/60 rounded-2xl p-6 space-y-4">
      <Skeleton size="lg" />
      <Skeleton size="full" className="h-4" />
      <Skeleton size="full" className="h-4" />
      <Skeleton size="md" />
    </div>
  )
}
