'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ToastContainer } from '@/components/ui/Toast'
import { useSaveStore } from '@/lib/store/save-store'

/* ─── Nav definition ───────────────────────────────────── */

const NAV = [
  { label: 'Timetable',  href: '/admin/timetable'     },
  { label: 'Setup',      href: '/admin/setup'         },
  { label: 'Operations', href: '/admin/substitutions' },
  { label: 'Events',     href: '/admin/events'        },
  { label: 'Settings',   href: '/admin/settings'      },
]

/* ─── Props ─────────────────────────────────────────────── */

interface AppLayoutProps {
  children: React.ReactNode
  schoolName?: string
  logoUrl?: string
  userName?: string
  userRole?: string
}

/* ─── Component ─────────────────────────────────────────── */

export function AppLayout({ children, schoolName, userName, userRole }: AppLayoutProps) {
  const pathname = usePathname()
  const { isSaving, lastSaved } = useSaveStore()
  const [savedFlash, setSavedFlash] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    if (lastSaved) {
      setSavedFlash(true)
      const t = setTimeout(() => setSavedFlash(false), 2000)
      return () => clearTimeout(t)
    }
  }, [lastSaved])

  const initials = userName
    ? userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A'

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-brand-linen)', color: 'var(--color-brand-mocha)' }}
    >
      {/* ── Top navigation bar ──────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: 'var(--color-brand-linen)',
          borderColor: 'var(--color-brand-sand)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/admin/timetable" className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-base select-none"
              style={{
                backgroundColor: 'var(--color-brand-mocha)',
                color: 'var(--color-brand-linen)',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
              }}
            >
              T
            </div>
            <div className="hidden sm:block leading-none">
              <span
                className="text-sm font-bold tracking-widest uppercase block leading-none"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  color: 'var(--color-brand-mocha)',
                }}
              >
                {schoolName ?? 'Tablo'}
              </span>
              <span
                className="text-[10px] uppercase tracking-widest mt-0.5 block"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-taupe)' }}
              >
                SchoolGrid System
              </span>
            </div>
          </Link>

          {/* Desktop nav tabs */}
          <nav
            className="hidden lg:flex items-center gap-1"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            {NAV.map(({ label, href }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-1.5 rounded-full uppercase tracking-wider transition-all',
                    active ? 'font-bold' : 'hover:opacity-80'
                  )}
                  style={
                    active
                      ? {
                          color: 'var(--color-brand-mocha)',
                          backgroundColor: 'var(--color-brand-champagne)',
                        }
                      : { color: 'var(--color-brand-taupe)' }
                  }
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Live compliance badge */}
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: 'var(--color-brand-success)' }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-brand-success)' }}
                />
              </span>
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-taupe)' }}
              >
                Clash-Free
              </span>
            </div>

            {/* Save indicator */}
            {isSaving && (
              <span
                className="text-xs animate-pulse"
                style={{ color: 'var(--color-brand-taupe)', fontFamily: 'var(--font-mono)' }}
              >
                Saving…
              </span>
            )}
            {savedFlash && !isSaving && (
              <span
                className="text-xs"
                style={{ color: 'var(--color-brand-success)', fontFamily: 'var(--font-mono)' }}
              >
                Saved ✓
              </span>
            )}

            <NotificationBell />

            {/* User avatar / menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 rounded-full px-2 py-1 transition-opacity hover:opacity-75"
                onBlur={() => setTimeout(() => setUserMenu(false), 150)}
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--color-brand-mocha)',
                    color: 'var(--color-brand-linen)',
                  }}
                >
                  {initials}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-brand-mocha)' }}
                  >
                    {userName ?? 'Admin'}
                  </p>
                  <p
                    className="text-[10px] capitalize"
                    style={{ color: 'var(--color-brand-taupe)' }}
                  >
                    {userRole ?? 'admin'}
                  </p>
                </div>
              </button>

              {userMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenu(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-lg z-20 py-1 overflow-hidden"
                    style={{
                      backgroundColor: 'var(--color-brand-linen)',
                      border: '0.5px solid var(--color-brand-sand)',
                    }}
                  >
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-2 px-4 py-2.5 transition-opacity hover:opacity-70"
                        style={{
                          color: 'var(--color-brand-taupe)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-brand-taupe)' }}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileNav ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileNav && (
          <div
            className="lg:hidden border-t px-4 py-3 flex flex-col gap-1"
            style={{
              backgroundColor: 'var(--color-brand-cream)',
              borderColor: 'var(--color-brand-sand)',
            }}
          >
            {NAV.map(({ label, href }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileNav(false)}
                  className="px-3 py-2 rounded-lg transition-opacity"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: active
                      ? 'var(--color-brand-mocha)'
                      : 'var(--color-brand-taupe)',
                    backgroundColor: active
                      ? 'var(--color-brand-champagne)'
                      : 'transparent',
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}
      </header>

      {/* ── Page content ────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      <ToastContainer />
    </div>
  )
}
