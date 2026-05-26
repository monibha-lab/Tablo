'use client'

import { BellOff, CheckCheck } from 'lucide-react'
import { formatDistanceToNow, isToday } from 'date-fns'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { Button } from '@/components/ui/Button'
import type { Notification } from '@/types'

interface NotificationDrawerProps {
  open: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

export function NotificationDrawer({
  open,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}: NotificationDrawerProps) {
  const todayNotifications = notifications.filter(
    (n) => n.created_at && isToday(new Date(n.created_at))
  )
  const earlierNotifications = notifications.filter(
    (n) => !n.created_at || !isToday(new Date(n.created_at))
  )

  const NotificationItem = ({ n }: { n: Notification }) => (
    <div
      className={`px-1 py-3 border-b border-sand/40 last:border-0 ${!n.read_at ? 'bg-champagne/20' : ''}`}
      onClick={() => !n.read_at && onMarkRead(n.id)}
    >
      <div className="flex items-start gap-3">
        {!n.read_at && (
          <div className="h-2 w-2 rounded-full bg-mocha flex-shrink-0 mt-1.5" />
        )}
        <div className={!n.read_at ? '' : 'pl-5'}>
          <p className="text-sm font-medium text-espresso">{n.title}</p>
          {n.body && <p className="text-xs text-taupe mt-0.5">{n.body}</p>}
          {n.created_at && (
            <p className="text-xs text-taupe/70 mt-1">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Notifications"
      footer={
        notifications.some((n) => !n.read_at) ? (
          <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="w-full">
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        ) : undefined
      }
    >
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BellOff className="h-8 w-8 text-taupe mb-3" />
          <p className="text-sm text-taupe">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-0">
          {todayNotifications.length > 0 && (
            <div>
              <p className="text-xs font-medium text-taupe uppercase tracking-wide mb-2">Today</p>
              {todayNotifications.map((n) => <NotificationItem key={n.id} n={n} />)}
            </div>
          )}
          {earlierNotifications.length > 0 && (
            <div className={todayNotifications.length > 0 ? 'mt-6' : ''}>
              <p className="text-xs font-medium text-taupe uppercase tracking-wide mb-2">Earlier</p>
              {earlierNotifications.map((n) => <NotificationItem key={n.id} n={n} />)}
            </div>
          )}
        </div>
      )}
    </SlidePanel>
  )
}
