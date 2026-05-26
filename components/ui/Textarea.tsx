'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helper, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-espresso">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'bg-cream border border-sand/80 rounded-xl px-4 py-2.5 text-sm text-espresso placeholder:text-taupe',
            'focus:outline-none focus:ring-2 focus:ring-mocha/30 focus:border-mocha/50',
            'transition-colors duration-150 resize-y min-h-[100px]',
            error && 'border-red-300 focus:ring-red-200',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {helper && !error && <p className="text-xs text-taupe">{helper}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
