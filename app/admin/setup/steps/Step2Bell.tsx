'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWizardStore } from '@/lib/store/wizard-store'

export function Step2Bell() {
  const { bellSchedule, setBellSchedule, setStep } = useWizardStore()
  const [schedule, setSchedule] = useState(bellSchedule)

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

  function handleNext() {
    setBellSchedule(schedule)
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

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  )
}
