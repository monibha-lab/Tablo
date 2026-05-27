'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, CalendarDays, Sun } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { AdminEvent, Grade, Section } from '@/types'

interface AdminEventsClientProps {
  events: AdminEvent[]
  grades: Grade[]
  sections: Section[]
  schoolId: string
}

const mono:  React.CSSProperties = { fontFamily: 'var(--font-mono)' }
const serif: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' }

export function AdminEventsClient({ events, grades, sections, schoolId }: AdminEventsClientProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [isHoliday, setIsHoliday] = useState(false)
  const [startSlot, setStartSlot] = useState(1)
  const [endSlot, setEndSlot] = useState(1)
  const [location, setLocation] = useState('')
  const [appliesTo, setAppliesTo] = useState<'school' | 'grade'>('school')
  const [gradeId, setGradeId] = useState('')
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  function reset() {
    setTitle('')
    setDate('')
    setIsHoliday(false)
    setStartSlot(1)
    setEndSlot(1)
    setLocation('')
    setAppliesTo('school')
    setGradeId('')
    setSelectedSectionIds([])
  }

  function toggleSection(id: string) {
    setSelectedSectionIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function selectAllSectionsForGrade() {
    const ids = sections.filter((s) => s.grade_id === gradeId).map((s) => s.id)
    setSelectedSectionIds(ids)
  }

  async function handleSave() {
    if (!title || !date) return
    setSaving(true)

    // Validate grade selection when applies_to is 'grade'
    if (appliesTo === 'grade' && !gradeId) {
      toast({ variant: 'error', title: 'Please select a grade' })
      setSaving(false)
      return
    }

    const { error } = await supabase.from('admin_events').insert({
      school_id: schoolId,
      title,
      date,
      is_holiday: isHoliday,
      start_slot: isHoliday ? null : startSlot,
      end_slot: isHoliday ? null : endSlot,
      location: location || null,
      applies_to: appliesTo,
      grade_id: appliesTo === 'grade' && gradeId ? gradeId : null,
      section_ids: appliesTo === 'grade' && selectedSectionIds.length > 0 ? selectedSectionIds : null,
    })

    if (error) {
      toast({ variant: 'error', title: 'Failed to create event' })
    } else {
      toast({ variant: 'success', title: 'Event created' })
      setPanelOpen(false)
      reset()
      router.refresh()
    }
    setSaving(false)
  }

  const grouped = events.reduce<Record<string, AdminEvent[]>>((acc, e) => {
    const key = e.date
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  const gradeSections = sections.filter((s) => s.grade_id === gradeId)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ ...serif, color: 'var(--color-brand-mocha)' }}>
            Events
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
            L&apos;Éphéméride — School Calendar
          </p>
        </div>
        <button
          onClick={() => { reset(); setPanelOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75"
          style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          Create Event
        </button>
      </div>

      {/* Event list */}
      {Object.entries(grouped).length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
        >
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--color-brand-mocha)' }} />
          <p className="text-sm uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
            No events yet
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, dateEvents]) => (
              <div key={dateKey}>
                <p className="text-[10px] uppercase tracking-widest mb-3" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                  {format(parseISO(dateKey), 'EEEE, MMMM d, yyyy')}
                </p>
                <div className="space-y-2">
                  {dateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-4 px-5 py-4 rounded-xl"
                      style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
                    >
                      {event.is_holiday ? (
                        <Sun className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-brand-warning)' }} />
                      ) : (
                        <CalendarDays className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-brand-clay)' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-brand-mocha)' }}>
                          {event.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                          {event.is_holiday
                            ? 'Holiday — Full Day'
                            : `Periods ${event.start_slot}–${event.end_slot}`}
                          {event.location && ` · ${event.location}`}
                        </p>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest flex-shrink-0"
                        style={{
                          ...mono,
                          backgroundColor: event.is_holiday
                            ? 'rgba(198,154,107,0.15)'
                            : event.applies_to === 'school'
                            ? 'rgba(60,53,48,0.07)'
                            : 'rgba(181,169,159,0.2)',
                          color: event.is_holiday
                            ? 'var(--color-brand-warning)'
                            : 'var(--color-brand-taupe)',
                        }}
                      >
                        {event.is_holiday ? 'Holiday' : event.applies_to === 'school' ? 'All' : event.grade?.name ?? 'Grade'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Create panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div
            className="fixed right-0 top-0 h-full z-50 w-full max-w-sm flex flex-col"
            style={{ backgroundColor: 'var(--color-brand-linen)', borderLeft: '0.5px solid var(--color-brand-sand)' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--color-brand-sand)' }}>
              <span className="text-sm font-bold uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>
                Create Event
              </span>
              <button onClick={() => setPanelOpen(false)} className="transition-opacity hover:opacity-70" style={{ color: 'var(--color-brand-taupe)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                  Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sports Day"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-mocha)' }}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-mocha)' }}
                />
              </div>

              {/* Holiday checkbox */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    backgroundColor: isHoliday ? 'var(--color-brand-mocha)' : 'var(--color-brand-cream)',
                    border: `0.5px solid ${isHoliday ? 'var(--color-brand-mocha)' : 'var(--color-brand-sand)'}`,
                  }}
                  onClick={() => setIsHoliday(!isHoliday)}
                >
                  {isHoliday && <span style={{ color: 'var(--color-brand-linen)', fontSize: '10px' }}>✓</span>}
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-brand-mocha)' }}>Mark as Holiday</p>
                  <p className="text-[10px] mt-0.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                    Full-day off — no periods affected
                  </p>
                </div>
              </label>

              {/* Period range (hidden for holidays) */}
              {!isHoliday && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Start Period</label>
                    <input
                      type="number"
                      min={1}
                      value={startSlot}
                      onChange={(e) => setStartSlot(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-mocha)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>End Period</label>
                    <input
                      type="number"
                      min={1}
                      value={endSlot}
                      onChange={(e) => setEndSlot(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-mocha)' }}
                    />
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Location (optional)</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sports Ground"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-mocha)' }}
                />
              </div>

              {/* Applies to */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Applies To</label>
                <div className="flex gap-2">
                  {(['school', 'grade'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setAppliesTo(opt); setSelectedSectionIds([]) }}
                      className="flex-1 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all"
                      style={{
                        ...mono,
                        backgroundColor: appliesTo === opt ? 'var(--color-brand-mocha)' : 'var(--color-brand-cream)',
                        color: appliesTo === opt ? 'var(--color-brand-linen)' : 'var(--color-brand-taupe)',
                        border: `0.5px solid ${appliesTo === opt ? 'var(--color-brand-mocha)' : 'var(--color-brand-sand)'}`,
                        fontWeight: appliesTo === opt ? 700 : 400,
                      }}
                    >
                      {opt === 'school' ? 'Whole School' : 'Grade'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade + sections */}
              {appliesTo === 'grade' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Grade</label>
                    <select
                      value={gradeId}
                      onChange={(e) => { setGradeId(e.target.value); setSelectedSectionIds([]) }}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-mocha)' }}
                    >
                      <option value="">— Select grade —</option>
                      {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>

                  {gradeId && gradeSections.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Sections</label>
                        <button
                          onClick={selectAllSectionsForGrade}
                          className="text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                          style={{ ...mono, color: 'var(--color-brand-clay)' }}
                        >
                          Select All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {gradeSections.map((sec) => {
                          const selected = selectedSectionIds.includes(sec.id)
                          return (
                            <button
                              key={sec.id}
                              onClick={() => toggleSection(sec.id)}
                              className="px-3 py-1.5 rounded-full text-xs transition-all"
                              style={{
                                ...mono,
                                backgroundColor: selected ? 'var(--color-brand-mocha)' : 'var(--color-brand-cream)',
                                color: selected ? 'var(--color-brand-linen)' : 'var(--color-brand-taupe)',
                                border: `0.5px solid ${selected ? 'var(--color-brand-mocha)' : 'var(--color-brand-sand)'}`,
                                fontWeight: selected ? 700 : 400,
                              }}
                            >
                              {sec.name}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-[10px] mt-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                        {selectedSectionIds.length === 0 ? 'All sections (none selected = all)' : `${selectedSectionIds.length} selected`}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t flex gap-2" style={{ borderColor: 'var(--color-brand-sand)' }}>
              <button
                onClick={() => setPanelOpen(false)}
                className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest transition-opacity hover:opacity-70"
                style={{ ...mono, backgroundColor: 'var(--color-brand-cream)', color: 'var(--color-brand-taupe)', border: '0.5px solid var(--color-brand-sand)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title || !date}
                className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75 disabled:opacity-40"
                style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
              >
                {saving ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
