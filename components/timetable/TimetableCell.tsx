'use client'

import { Lock, Plus, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimetableSlot, Subject, Teacher, Room } from '@/types'

interface TimetableCellProps {
  slot: TimetableSlot | null
  subject?: Subject | null
  teacher?: Teacher | null
  room?: Room | null
  readOnly?: boolean
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export function TimetableCell({
  slot,
  subject,
  teacher,
  room,
  readOnly = false,
  onClick,
  onContextMenu,
}: TimetableCellProps) {
  if (!slot) {
    return (
      <div
        className={cn(
          'h-24 border border-sand/20 rounded-lg bg-ivory flex items-center justify-center',
          !readOnly && 'cursor-pointer hover:border-sand hover:bg-cream/30 group transition-colors'
        )}
        onClick={onClick}
      >
        {!readOnly && (
          <Plus className="h-4 w-4 text-sand group-hover:text-taupe transition-colors" />
        )}
      </div>
    )
  }

  if (!slot.subject_id) {
    return (
      <div
        className={cn(
          'h-24 border border-dashed border-sand/40 rounded-lg bg-sand/30 flex items-center justify-center',
          !readOnly && 'cursor-pointer hover:bg-sand/40 transition-colors'
        )}
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        <span className="text-xs text-taupe">unassigned</span>
      </div>
    )
  }

  const colorHex = subject?.color_hex ?? '#E8E0D0'

  const cellClass = slot.is_fixed
    ? 'bg-blush/50 border-nude/60'
    : slot.is_combined
    ? 'bg-champagne/80 border-sand/40'
    : slot.is_elective
    ? 'bg-cream border-sand/40'
    : 'bg-champagne/60 border-sand/40'

  return (
    <div
      className={cn(
        'h-24 border rounded-lg px-2.5 py-2 relative overflow-hidden cursor-pointer',
        'hover:shadow-sm transition-all duration-150',
        cellClass,
        !readOnly && 'group'
      )}
      style={{
        borderLeftColor: colorHex,
        borderLeftWidth: 3,
        backgroundColor: `${colorHex}26`,
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <p className="text-xs font-semibold text-espresso truncate leading-tight">
        {subject?.name ?? '—'}
      </p>
      {teacher && (
        <p className="text-[10px] text-taupe mt-0.5 truncate">{teacher.name}</p>
      )}
      {room && (
        <p className="text-[10px] text-taupe/80 truncate">{room.name}</p>
      )}

      <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
        {slot.is_locked && (
          <Lock className="h-3 w-3 text-taupe/60" />
        )}
        {slot.is_combined && (
          <span className="text-[9px] bg-champagne text-mocha px-1 rounded">combined</span>
        )}
        {slot.is_elective && (
          <span className="text-[9px] bg-cream text-mocha px-1 rounded border border-sand">elective</span>
        )}
      </div>
    </div>
  )
}
