'use client'

import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWizardStore } from '@/lib/store/wizard-store'

type LocalTeacher = {
  name: string
  email: string
  subjects: string[]
  maxPeriods: number
  dbId?: string
}

function generateUsername(name: string, existing: string[]): string {
  const parts = name.toLowerCase().trim().split(/\s+/)
  const base =
    parts.length >= 2
      ? `${parts[0]}.${parts[parts.length - 1]}`
      : parts[0] || 'teacher'
  const slug = base.replace(/[^a-z0-9.]/g, '')
  let candidate = slug
  let i = 2
  while (existing.includes(candidate)) {
    candidate = `${slug}${i}`
    i++
  }
  return candidate
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function Step4Teachers() {
  const { teachers, setTeachers, schoolId, setStep } = useWizardStore()
  const [localTeachers, setLocalTeachers] = useState<LocalTeacher[]>(teachers)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Subject tag input per teacher row: idx -> current input value
  const [subjectInputs, setSubjectInputs] = useState<Record<number, string>>({})

  function addTeacher() {
    setLocalTeachers((t) => [
      ...t,
      { name: '', email: '', subjects: [], maxPeriods: 6 },
    ])
  }

  function updateTeacher(idx: number, field: string, value: string | number) {
    setLocalTeachers((t) => t.map((teacher, i) => (i === idx ? { ...teacher, [field]: value } : teacher)))
  }

  function removeTeacher(idx: number) {
    setLocalTeachers((t) => t.filter((_, i) => i !== idx))
  }

  function addSubject(teacherIdx: number) {
    const val = (subjectInputs[teacherIdx] ?? '').trim()
    if (!val) return
    setLocalTeachers((t) =>
      t.map((teacher, i) =>
        i === teacherIdx && !teacher.subjects.includes(val)
          ? { ...teacher, subjects: [...teacher.subjects, val] }
          : teacher
      )
    )
    setSubjectInputs((s) => ({ ...s, [teacherIdx]: '' }))
  }

  function removeSubject(teacherIdx: number, subject: string) {
    setLocalTeachers((t) =>
      t.map((teacher, i) =>
        i === teacherIdx
          ? { ...teacher, subjects: teacher.subjects.filter((s) => s !== subject) }
          : teacher
      )
    )
  }

  async function handleNext() {
    const filtered = localTeachers.filter((t) => t.name.trim())
    setTeachers(filtered)

    if (!schoolId) {
      setStep(5)
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Only create teachers that don't have a dbId yet
      const toCreate = filtered.filter((t) => !t.dbId)

      // Collect existing usernames to avoid collisions
      const existingUsernames: string[] = []

      for (const teacher of toCreate) {
        const username = generateUsername(teacher.name, existingUsernames)
        const pin = generatePin()
        const internalEmail = teacher.email.trim() || `${username}@school.tablo.internal`

        existingUsernames.push(username)

        const res = await fetch('/api/admin/create-teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: teacher.name,
            username,
            email: internalEmail,
            pin,
            schoolId,
            maxPeriods: teacher.maxPeriods,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          // Mark teacher as saved
          teacher.dbId = data.teacherId ?? 'created'
        }
        // Silently continue on error — teacher can be added later via management page
      }

      // Sync the dbIds back to store
      setTeachers(filtered)
    } catch {
      setError('Some teachers could not be saved. You can add them later from the Faculty page.')
    }

    setSaving(false)
    setStep(5)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cormorant text-3xl font-semibold text-espresso mb-2">Teachers</h2>
        <p className="text-taupe">Add your teaching staff. Email is optional — a login username and PIN will be generated automatically.</p>
      </div>

      <div className="space-y-4">
        {localTeachers.map((teacher, i) => (
          <div key={i} className="bg-cream/50 rounded-xl p-4 space-y-4">
            {/* Row 1: name, email, max periods, remove */}
            <div className="flex gap-3 items-end">
              <Input
                label="Full Name *"
                value={teacher.name}
                onChange={(e) => updateTeacher(i, 'name', e.target.value)}
                placeholder="e.g. Sarah Johnson"
                className="flex-1"
              />
              <Input
                label="Email (optional)"
                value={teacher.email}
                onChange={(e) => updateTeacher(i, 'email', e.target.value)}
                placeholder="teacher@school.edu"
                className="flex-1"
              />
              <Input
                label="Max periods/day"
                type="number"
                value={teacher.maxPeriods}
                onChange={(e) => updateTeacher(i, 'maxPeriods', Number(e.target.value))}
                className="w-28"
                min={1}
                max={12}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTeacher(i)}
                className="mb-0.5 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Row 2: subjects taught */}
            <div>
              <p className="text-xs font-medium text-espresso mb-2">Subjects taught (optional)</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {teacher.subjects.map((sub) => (
                  <span
                    key={sub}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: 'rgba(181,169,159,0.2)',
                      color: 'var(--color-brand-mocha)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {sub}
                    <button
                      onClick={() => removeSubject(i, sub)}
                      className="transition-opacity hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={subjectInputs[i] ?? ''}
                  onChange={(e) => setSubjectInputs((s) => ({ ...s, [i]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubject(i) } }}
                  placeholder="e.g. Mathematics"
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none bg-ivory border border-sand text-espresso"
                />
                <Button variant="secondary" size="sm" onClick={() => addSubject(i)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-taupe mt-1">Press Enter or click + to add. Subject-grade assignments can be configured from the Faculty page.</p>
            </div>

            {teacher.dbId && (
              <p className="text-xs text-green-600" style={{ fontFamily: 'var(--font-mono)' }}>
                ✓ Saved
              </p>
            )}
          </div>
        ))}

        <Button variant="secondary" onClick={addTeacher} className="w-full">
          <Plus className="h-4 w-4" /> Add teacher
        </Button>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
        <Button onClick={handleNext} loading={saving}>
          {localTeachers.filter((t) => t.name.trim()).length === 0 ? 'Skip for now' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
