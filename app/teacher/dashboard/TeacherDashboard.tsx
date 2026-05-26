'use client'

import { useState } from 'react'
import { Clock, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { Textarea } from '@/components/ui/Textarea'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Teacher, TimetableSlot, PeriodSlot } from '@/types'

interface TeacherDashboardProps {
  teacher: Teacher
  todaySlots: (TimetableSlot & {
    subjects: { name: string; color_hex: string } | null
    sections: { name: string; grades: { name: string } | null } | null
    rooms: { name: string } | null
  })[]
  periodSlots: PeriodSlot[]
  today: string
}

export function TeacherDashboard({ teacher, todaySlots, periodSlots, today }: TeacherDashboardProps) {
  const [unavailableSlot, setUnavailableSlot] = useState<TimetableSlot | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  function getPeriodSlot(slotNumber: number) {
    return periodSlots.find((p) => p.slot_number === slotNumber)
  }

  async function handleMarkUnavailable() {
    if (!unavailableSlot) return
    setSubmitting(true)
    const today = new Date().toISOString().split('T')[0]

    await supabase.from('period_unavailabilities').insert({
      teacher_id: teacher.id,
      timetable_slot_id: unavailableSlot.id,
      date: today,
      note_for_sub: note || null,
    })

    toast({ variant: 'success', title: 'Marked as unavailable', description: 'A sub request has been created.' })
    setUnavailableSlot(null)
    setNote('')
    setSubmitting(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-1">
          Good morning, {teacher.name.split(' ')[0]}
        </h1>
        <p className="text-taupe">{today}</p>
      </div>

      <div className="space-y-3">
        {todaySlots.length === 0 ? (
          <Card className="text-center py-16">
            <BookOpen className="h-10 w-10 text-taupe/40 mx-auto mb-3" />
            <p className="text-taupe">No classes today. Enjoy your free day!</p>
          </Card>
        ) : (
          todaySlots
            .sort((a, b) => a.slot_number - b.slot_number)
            .map((slot) => {
              const period = getPeriodSlot(slot.slot_number)
              return (
                <div
                  key={slot.id}
                  className="bg-ivory border border-sand/60 rounded-2xl p-4 flex items-center gap-4"
                  style={{ borderLeftColor: slot.subjects?.color_hex ?? '#E8E0D0', borderLeftWidth: 4 }}
                >
                  <div className="flex-shrink-0 w-16 text-center">
                    <p className="text-xs font-medium text-taupe">{period?.start_time?.slice(0, 5)}</p>
                    <p className="text-xs text-taupe/60">{period?.label}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-espresso">{slot.subjects?.name}</p>
                    <p className="text-sm text-taupe">
                      {(slot.sections?.grades as unknown as { name: string })?.name} {slot.sections?.name}
                      {slot.rooms && ` • ${slot.rooms.name}`}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setUnavailableSlot(slot)}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Mark unavailable
                  </Button>
                </div>
              )
            })
        )}
      </div>

      <SlidePanel
        open={!!unavailableSlot}
        onClose={() => { setUnavailableSlot(null); setNote('') }}
        title="Mark period unavailable"
        subtitle="A substitute request will be sent to available teachers."
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setUnavailableSlot(null)}>Cancel</Button>
            <Button onClick={handleMarkUnavailable} loading={submitting}>Submit</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {unavailableSlot && (
            <div className="bg-cream rounded-xl p-3">
              <p className="text-sm font-medium text-espresso">{unavailableSlot.subject_id}</p>
              <p className="text-xs text-taupe">Period {unavailableSlot.slot_number}</p>
            </div>
          )}
          <Textarea
            label="Note for substitute (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any instructions or context for the substitute teacher..."
          />
        </div>
      </SlidePanel>
    </div>
  )
}
