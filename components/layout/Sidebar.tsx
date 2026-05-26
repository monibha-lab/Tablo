'use client'

import {
  Calendar,
  Users,
  DoorOpen,
  BookOpen,
  BarChart2,
  Settings,
  Lock,
  Layers,
  Zap,
  CalendarRange,
  X,
  Menu,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const adminNavItems: NavItem[] = [
  { label: 'Timetable', href: '/admin/timetable', icon: <Calendar className="h-4 w-4" /> },
  { label: 'Substitutions', href: '/admin/substitutions', icon: <Layers className="h-4 w-4" /> },
  { label: 'Events', href: '/admin/events', icon: <CalendarRange className="h-4 w-4" /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart2 className="h-4 w-4" /> },
]

const configNavItems: NavItem[] = [
  { label: 'Teachers', href: '/admin/setup/teachers', icon: <Users className="h-4 w-4" /> },
  { label: 'Rooms', href: '/admin/setup/rooms', icon: <DoorOpen className="h-4 w-4" /> },
  { label: 'Subjects', href: '/admin/setup/subjects', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Fixed Periods', href: '/admin/setup/fixed-periods', icon: <Lock className="h-4 w-4" /> },
  { label: 'Combined Classes', href: '/admin/setup/combined', icon: <Layers className="h-4 w-4" /> },
  { label: 'Electives', href: '/admin/setup/electives', icon: <Zap className="h-4 w-4" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="h-4 w-4" /> },
]

interface SidebarContentProps {
  schoolName?: string
  logoUrl?: string
  onClose?: () => void
}

function SidebarContent({ schoolName = 'Tablo', logoUrl, onClose }: SidebarContentProps) {
  const pathname = usePathname()

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
          active
            ? 'bg-sand/50 text-mocha font-medium'
            : 'text-clay hover:text-mocha hover:bg-cream/50'
        )}
      >
        {item.icon}
        {item.label}
      </Link>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-sand/40">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={schoolName} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-mocha flex items-center justify-center">
              <span className="text-ivory text-xs font-bold font-cormorant">T</span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-espresso font-cormorant">{schoolName}</p>
            <p className="text-xs text-taupe">Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <div className="pt-4 pb-1">
          <p className="px-3 text-xs font-medium text-taupe uppercase tracking-wide mb-2">
            Configuration
          </p>
          {configNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>
    </div>
  )
}

interface SidebarProps {
  schoolName?: string
  logoUrl?: string
}

export function Sidebar({ schoolName, logoUrl }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-cream border-r border-sand/50 min-h-screen flex-col flex-shrink-0">
        <SidebarContent schoolName={schoolName} logoUrl={logoUrl} />
      </aside>

      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-ivory border border-sand shadow"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5 text-mocha" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-espresso/20" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-cream border-r border-sand/50 flex flex-col">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-taupe hover:text-mocha hover:bg-sand/40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              schoolName={schoolName}
              logoUrl={logoUrl}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  )
}
