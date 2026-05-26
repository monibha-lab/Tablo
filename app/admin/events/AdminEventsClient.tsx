'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { AdminEvent, Grade, Section } from '@/types'

interface AdminEventsClientProps {
  events: AdminEvent[]
  grades: Grade[]
  sections: Section[]
  schoolId: string
}

export function AdminEventsClient({ events, grades, sections, schoolId }: AdminEventsClientProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startSlot, setStartSlot] = useState(1)
  const [endSlot, setEndSlot] = useState(1)
  const [location, setLocation] = useState('')
  const [appliesTo, setAppliesTo] = useState<'sections' | 'grade' | 'school'>('school')
  const [gradeId, setGradeId] = useState('')
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  async function handleSave() {
    if (!title || !date) return
    setSaving(true)

    const { error } = await supabase.from('admin_events').insert({
      school_id: schoolId,
      title,
      date,
      start_slot: startSlot,
      end_slot: endSlot,
      location: location || null,
      applies_to: appliesTo,
      grade_id: appliesTo === 'grade' ? gradeId : null,
    })

    if (error) {
      toast({ variant: 'error', title: 'Failed to create event' })
    } else {
      toast({ variant: 'success', title: 'Event created' })
      setOpen(false)
      router.refresh()
    }
    setSaving(false)
  }

  // Group events by date
  const grouped = events.reduce<Record<string, AdminEvent[]>>((acc, e) => {
    const key = e.date
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Events</h1>
          <p className="text-taupe">School events that affect the timetable.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create event
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).length === 0 ? (
          <p className="text-taupe text-center py-16">No events yet.</p>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-taupe mb-3">
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="space-y-2">
                  {dateEvents.map((event) => (
                    <div key={event.id} className="bg-ivory border border-sand/60 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-espresso">{event.title}</p>
                          <p className="text-xs text-taupe mt-0.5">
                            Periods {event.start_slot}–{event.end_slot}
                            {event.location && ` • ${event.location}`}
                          </p>
                        </div>
                        <Badge variant="info">
                          {event.applies_to === 'school' ? 'Whole school' : event.applies_to}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

      <SlidePanel
        open={open}
        onClose={() => setOpen(false)}
        title="Create event"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Create</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start period" type="number" value={startSlot} onChange={(e) => setStartSlot(Number(e.target.value))} min={1} />
            <Input label="End period" type="number" value={endSlot} onChange={(e) => setEndSlot(Number(e.target.value))} min={1} />
          </div>
          <Input label="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Select label="Applies to" value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as 'sections' | 'grade' | 'school')}>
            <option value="school">Whole school</option>
            <option value="grade">Grade</option>
            <option value="sections">Specific sections</option>
          </Select>
          {appliesTo === 'grade' && (
            <Select label="Grade" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              <option value="">Select grade</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          )}
        </div>
      </SlidePanel>
    </div>
  )
}
