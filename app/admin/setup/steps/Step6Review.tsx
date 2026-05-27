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
  const totalSubjects = new Set(grades.flatMap((g) => g.subjects)).size

  async function handleFinish() {
    if (!schoolId) {
      setError('School not created yet. Please go back to step 1.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Create the default active term (everything else was saved per-step)
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
    } catch {
      setError('Something went wrong. Please try again.')
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

      {totalSubjects > 0 && (
        <div className="rounded-xl px-5 py-4 bg-cream/50 border border-sand">
          <p className="text-xs uppercase tracking-widest text-taupe mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            Subjects configured
          </p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(grades.flatMap((g) => g.subjects))].map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-full text-xs"
                style={{
                  fontFamily: 'var(--font-mono)',
                  backgroundColor: 'rgba(181,169,159,0.2)',
                  color: 'var(--color-brand-mocha)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl px-5 py-4 bg-cream/50 border border-sand">
        <p className="text-xs uppercase tracking-widest text-taupe" style={{ fontFamily: 'var(--font-mono)' }}>
          Bell schedule · {bellSchedule.periodsPerDay} periods/day · {bellSchedule.periodDuration} min each
        </p>
        <p className="text-xs text-taupe mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
          {bellSchedule.schoolStart} — {bellSchedule.schoolEnd}
        </p>
      </div>

      <div className="rounded-xl px-5 py-4 bg-champagne/40 border border-sand">
        <p className="text-sm font-medium text-espresso mb-1">A default term will be created</p>
        <p className="text-xs text-taupe">
          You can edit terms, add more grades, teachers, and subjects at any time from the Settings and Setup pages.
          Timetable generation will use all the data you&apos;ve entered.
        </p>
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
