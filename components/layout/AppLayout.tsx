'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { ToastContainer } from '@/components/ui/Toast'
import { CommandPalette } from '@/components/ui/CommandPalette'

interface AppLayoutProps {
  children: React.ReactNode
  schoolName?: string
  logoUrl?: string
  userName?: string
  userRole?: string
}

export function AppLayout({ children, schoolName, logoUrl, userName, userRole }: AppLayoutProps) {
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-ivory">
      <Sidebar schoolName={schoolName} logoUrl={logoUrl} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav userName={userName} userRole={userRole} />
        <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-10">
          {children}
        </main>
      </div>
      <ToastContainer />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
