'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWizardStore } from '@/lib/store/wizard-store'
import { createClient } from '@/lib/supabase/client'

export function Step2Bell() {
  const { bellSchedule, setBellSchedule, setBellScheduleId, schoolId, setStep } = useWizardStore()
  const [schedule, setSchedule] = useState(bellSchedule)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  function addBreak() {
    setSchedule((s) => ({
      ...s,
      breaks: [...s.breaks, { name: 'Break', after: 4, duration: 15 }],
    }))
  }

  function removeBreak(idx: number) {
    setSchedule((s) => ({ ...s, breaks: s.breaks.filter((_, i) => i !== idx) }))
  }

  function updateBreak(idx: number, field: string, value: string | number) {
    setSchedule((s) => ({
      ...s,
      breaks: s.breaks.map((b, i) => (i === idx ? { ...b, [field]: value } : b)),
    }))
  }

  async function handleNext() {
    setBellSchedule(schedule)

    if (!schoolId) {
      setStep(3)
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Delete existing bell schedule (period_slots cascade-delete)
      const { data: existing } = await supabase
        .from('bell_schedules')
        .select('id')
        .eq('school_id', schoolId)
        .maybeSingle()

      if (existing) {
        await supabase.from('bell_schedules').delete().eq('id', existing.id)
      }

      // Insert new bell schedule
      const { data: bs, error: bsError } = await supabase
        .from('bell_schedules')
        .insert({
          school_id: schoolId,
          school_start: schedule.schoolStart,
          school_end: schedule.schoolEnd,
          period_duration_minutes: schedule.periodDuration,
          periods_per_day: schedule.periodsPerDay,
        })
        .select()
        .single()

      if (bsError || !bs) {
        setError('Failed to save bell schedule. Please try again.')
        setSaving(false)
        return
      }

      setBellScheduleId(bs.id)

      // Build period slots array (including breaks)
      const slots: Array<{
        bell_schedule_id: string
        slot_number: number
        label: string
        start_time: string
        end_time: string
        is_break?: boolean
      }> = []

      let currentTime = schedule.schoolStart
      for (let i = 1; i <= schedule.periodsPerDay; i++) {
        const [h, m] = currentTime.split(':').map(Number)
        const endMin = h * 60 + m + schedule.periodDuration
        const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

        slots.push({
          bell_schedule_id: bs.id,
          slot_number: i,
          label: `Period ${i}`,
          start_time: currentTime,
          end_time: endTime,
        })

        const breakAfter = schedule.breaks.find((b) => b.after === i)
        if (breakAfter) {
          const breakEnd = endMin + breakAfter.duration
          const breakEndTime = `${String(Math.floor(breakEnd / 60)).padStart(2, '0')}:${String(breakEnd % 60).padStart(2, '0')}`
          slots.push({
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

      await supabase.from('period_slots').insert(slots)
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    setSaving(false)
    setStep(3)
  }

  const previewSlots = []
  let currentTime = schedule.schoolStart
  for (let i = 1; i <= schedule.periodsPerDay; i++) {
    const [h, m] = currentTime.split(':').map(Number)
    const endMin = h * 60 + m + schedule.periodDuration
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
    previewSlots.push({ label: `Period ${i}`, start: currentTime, end: endTime })
    const breakAfter = schedule.breaks.find((b) => b.after === i)
    if (breakAfter) {
      const breakEnd = endMin + breakAfter.duration
      const breakEndTime = `${String(Math.floor(breakEnd / 60)).padStart(2, '0')}:${String(breakEnd % 60).padStart(2, '0')}`
      previewSlots.push({ label: breakAfter.name, start: endTime, end: breakEndTime, isBreak: true })
      currentTime = breakEndTime
    } else {
      currentTime = endTime
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cormorant text-3xl font-semibold text-espresso mb-2">Bell Schedule</h2>
        <p className="text-taupe">Define when the school day starts, ends, and how periods are structured.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="School starts"
              type="time"
              value={schedule.schoolStart}
              onChange={(e) => setSchedule((s) => ({ ...s, schoolStart: e.target.value }))}
            />
            <Input
              label="School ends"
              type="time"
              value={schedule.schoolEnd}
              onChange={(e) => setSchedule((s) => ({ ...s, schoolEnd: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Period duration (min)"
              type="number"
              value={schedule.periodDuration}
              onChange={(e) => setSchedule((s) => ({ ...s, periodDuration: Number(e.target.value) }))}
              min={20}
              max={90}
            />
            <Input
              label="Periods per day"
              type="number"
              value={schedule.periodsPerDay}
              onChange={(e) => setSchedule((s) => ({ ...s, periodsPerDay: Number(e.target.value) }))}
              min={1}
              max={12}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-espresso">Breaks</label>
              <Button variant="ghost" size="sm" onClick={addBreak}>
                <Plus className="h-3.5 w-3.5" /> Add break
              </Button>
            </div>
            <div className="space-y-2">
              {schedule.breaks.map((b, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <Input
                    label="Name"
                    value={b.name}
                    onChange={(e) => updateBreak(i, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    label="After period"
                    type="number"
                    value={b.after}
                    onChange={(e) => updateBreak(i, 'after', Number(e.target.value))}
                    className="w-24"
                    min={1}
                  />
                  <Input
                    label="Duration (min)"
                    type="number"
                    value={b.duration}
                    onChange={(e) => updateBreak(i, 'duration', Number(e.target.value))}
                    className="w-24"
                    min={5}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBreak(i)}
                    className="mb-0.5 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-espresso mb-3">Preview</p>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {previewSlots.map((slot, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  slot.isBreak ? 'bg-sand/40 text-taupe' : 'bg-champagne/40 text-espresso'
                }`}
              >
                <span className="font-mono text-xs w-20 text-taupe">{slot.start}</span>
                <span className="flex-1 font-medium">{slot.label}</span>
                <span className="font-mono text-xs text-taupe">{slot.end}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
        <Button onClick={handleNext} loading={saving}>Continue</Button>
      </div>
    </div>
  )
}
