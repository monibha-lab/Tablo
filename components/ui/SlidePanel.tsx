'use client'

import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SlidePanelProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function SlidePanel({ open, onClose, title, subtitle, children, footer, className }: SlidePanelProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-espresso/10 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-[480px] bg-ivory border-l border-sand',
          'flex flex-col shadow-2xl',
          className
        )}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-sand/60">
          <div>
            {title && <h2 className="font-cormorant text-2xl font-semibold text-espresso">{title}</h2>}
            {subtitle && <p className="text-sm text-taupe mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-taupe hover:text-mocha transition-colors p-1 rounded-lg hover:bg-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-sand/60 bg-cream/50">{footer}</div>
        )}
      </div>
    </div>
  )
}
