'use client'

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useToastStore, type ToastVariant } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-600" />,
  error: <AlertCircle className="h-4 w-4 text-red-600" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  info: <Info className="h-4 w-4 text-blue-600" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'bg-ivory border border-sand rounded-xl px-4 py-3 shadow-md',
            'flex items-start gap-3 animate-in slide-in-from-right-5 duration-200'
          )}
        >
          <span className="mt-0.5 flex-shrink-0">{icons[toast.variant]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-espresso">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-taupe mt-0.5">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-taupe hover:text-mocha transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
