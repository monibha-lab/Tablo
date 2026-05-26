import { cn } from '@/lib/utils'

interface AvatarProps {
  name?: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-nude text-mocha flex items-center justify-center font-medium flex-shrink-0',
        sizes[size],
        className
      )}
    >
      {name ? getInitials(name) : '?'}
    </div>
  )
}
