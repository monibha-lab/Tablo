'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useWizardStore } from '@/lib/store/wizard-store'
import { createClient } from '@/lib/supabase/client'
import { format, addMonths } from 'date-fns'

export function Step6Review() {
  const { schoolId, schoolName, bellSchedule, rooms, teachers, grades, setStep, setTermId } = useWizardStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const totalSections = grades.reduce((acc, g) => acc + g.sections.length, 0)

  async function handleFinish() {
    if (!schoolId) {
      setError('School not created yet. Please go back to step 1.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Create bell schedule
      const { data: bs } = await supabase
        .from('bell_schedules')
        .insert({
          school_id: schoolId,
          school_start: bellSchedule.schoolStart,
          school_end: bellSchedule.schoolEnd,
          period_duration_minutes: bellSchedule.periodDuration,
          periods_per_day: bellSchedule.periodsPerDay,
        })
        .select()
        .single()

      if (bs) {
        // Create period slots
        let currentTime = bellSchedule.schoolStart
        for (let i = 1; i <= bellSchedule.periodsPerDay; i++) {
          const [h, m] = currentTime.split(':').map(Number)
          const endMin = h * 60 + m + bellSchedule.periodDuration
          const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
          await supabase.from('period_slots').insert({
            bell_schedule_id: bs.id,
            slot_number: i,
            label: `Period ${i}`,
            start_time: currentTime,
            end_time: endTime,
          })
          const breakAfter = bellSchedule.breaks.find((b) => b.after === i)
          if (breakAfter) {
            const breakEnd = endMin + breakAfter.duration
            const breakEndTime = `${String(Math.floor(breakEnd / 60)).padStart(2, '0')}:${String(breakEnd % 60).padStart(2, '0')}`
            await supabase.from('period_slots').insert({
              bell_schedule_id: bs.id,
              slot_number: i + 0.5,
              label: breakAfter.name,
              start_time: endTime,
              end_time: breakEndTime,
              is_break: true,
            })
            currentTime = breakEndTime
          } else {
            currentTime = endTime
          }
        }
      }

      // Create rooms
      if (rooms.length > 0) {
        await supabase.from('rooms').insert(
          rooms.map((r) => ({
            school_id: schoolId,
            name: r.name,
            type: r.type as 'classroom' | 'lab' | 'sports' | 'library' | 'auditorium' | 'other',
            max_simultaneous_use: r.maxSimultaneousUse,
          }))
        )
      }

      // Create teachers
      for (const t of teachers) {
        await supabase.from('teachers').insert({
          school_id: schoolId,
          name: t.name,
          email: t.email,
          max_periods_per_day: t.maxPeriods,
        })
      }

      // Create grades and sections
      for (let gi = 0; gi < grades.length; gi++) {
        const grade = grades[gi]
        const { data: g } = await supabase
          .from('grades')
          .insert({ school_id: schoolId, name: grade.name, order_index: gi })
          .select()
          .single()

        if (g) {
          for (const section of grade.sections) {
            await supabase.from('sections').insert({
              grade_id: g.id,
              name: section.name,
              class_teacher_period_first: section.homeroomFirst,
            })
          }
        }
      }

      // Create active term
      const now = new Date()
      const { data: term } = await supabase
        .from('terms')
        .insert({
          school_id: schoolId,
          name: `Term 1 — ${format(now, 'yyyy')}`,
          start_date: format(now, 'yyyy-MM-dd'),
          end_date: format(addMonths(now, 4), 'yyyy-MM-dd'),
          is_active: true,
        })
        .select()
        .single()

      if (term) setTermId(term.id)

      router.push('/admin/timetable')
    } catch (e) {
      setError('Something went wrong. Please try again.')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cormorant text-3xl font-semibold text-espresso mb-2">Review & Finish</h2>
        <p className="text-taupe">Here&apos;s a summary of what you&apos;ve configured for {schoolName}.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Teachers', value: teachers.length },
          { label: 'Rooms', value: rooms.length },
          { label: 'Grades', value: grades.length },
          { label: 'Sections', value: totalSections },
        ].map((stat) => (
          <Card key={stat.label} className="text-center py-6">
            <p className="font-cormorant text-4xl font-semibold text-espresso">{stat.value}</p>
            <p className="text-sm text-taupe mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(5)}>Back</Button>
        <Button onClick={handleFinish} loading={saving}>
          <CheckCircle className="h-4 w-4" /> Complete Setup
        </Button>
      </div>
    </div>
  )
}
