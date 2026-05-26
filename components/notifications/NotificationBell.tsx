'use client'

import { Bell } from 'lucide-react'
import { useState } from 'react'
import { NotificationDrawer } from './NotificationDrawer'
import { useRealtimeNotifications } from '@/lib/notifications/realtime'

interface NotificationBellProps {
  userId?: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markRead, markAllRead } = useRealtimeNotifications(userId ?? null)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 text-taupe hover:text-mocha hover:bg-cream rounded-xl transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDrawer
        open={open}
        onClose={() => setOpen(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </>
  )
}
