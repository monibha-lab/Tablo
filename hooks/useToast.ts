'use client'

import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

export function useToast() {
  const { addToast } = useToastStore()
  return {
    toast: addToast,
    success: (title: string, description?: string) => addToast({ variant: 'success', title, description }),
    error: (title: string, description?: string) => addToast({ variant: 'error', title, description }),
    warning: (title: string, description?: string) => addToast({ variant: 'warning', title, description }),
    info: (title: string, description?: string) => addToast({ variant: 'info', title, description }),
  }
}

export { useToastStore }
