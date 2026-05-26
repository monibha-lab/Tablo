'use client'

import { LogOut, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { signOut } from '@/app/actions/auth'
import { useSaveStore } from '@/lib/store/save-store'

interface TopNavProps {
  userName?: string
  userRole?: string
}

export function TopNav({ userName, userRole }: TopNavProps) {
  const { isSaving, lastSaved } = useSaveStore()
  const [showSaved, setShowSaved] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (lastSaved) {
      setShowSaved(true)
      const t = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(t)
    }
  }, [lastSaved])

  return (
    <header className="bg-ivory border-b border-sand/40 h-14 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-taupe bg-cream border border-sand/60 rounded-lg px-2.5 py-1.5">
          <Search className="h-3 w-3" />
          <span>Search</span>
          <kbd className="text-[10px] bg-sand/50 border border-sand rounded px-1">⌘K</kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isSaving && (
          <span className="text-xs text-taupe animate-pulse">Saving...</span>
        )}
        {showSaved && !isSaving && (
          <span className="text-xs text-green-700 transition-opacity">Saved ✓</span>
        )}

        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-cream rounded-xl px-2 py-1.5 transition-colors"
          >
            <Avatar name={userName} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-espresso leading-tight">{userName}</p>
              <p className="text-[10px] text-taupe capitalize">{userRole}</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-ivory border border-sand rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-clay hover:text-mocha hover:bg-cream transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
