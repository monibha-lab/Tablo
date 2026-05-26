'use client'

import { ChevronDown } from 'lucide-react'
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helper?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helper, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-espresso">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none bg-cream border border-sand/80 rounded-xl px-4 py-2.5 text-sm text-espresso',
              'focus:outline-none focus:ring-2 focus:ring-mocha/30 focus:border-mocha/50',
              'transition-colors duration-150 pr-10',
              error && 'border-red-300 focus:ring-red-200',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-taupe pointer-events-none" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {helper && !error && <p className="text-xs text-taupe">{helper}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
