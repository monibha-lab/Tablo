'use client'

import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-espresso/10 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-ivory rounded-2xl border border-sand shadow-2xl',
          'w-full max-w-[480px] mx-4',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-sand/60">
            <h2 className="font-cormorant text-2xl font-semibold text-espresso">{title}</h2>
            <button
              onClick={onClose}
              className="text-taupe hover:text-mocha transition-colors p-1 rounded-lg hover:bg-cream"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-sand/60 bg-cream/50 rounded-b-2xl">{footer}</div>
        )}
      </div>
    </div>
  )
}
