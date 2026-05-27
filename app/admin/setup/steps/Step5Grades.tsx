'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWizardStore } from '@/lib/store/wizard-store'
import { createClient } from '@/lib/supabase/client'

type LocalGrade = {
  name: string
  subjects: string[]
  sections: { name: string; classTeacher: string | null; homeroomFirst: boolean }[]
}

export function Step5Grades() {
  const { grades, setGrades, schoolId, setStep } = useWizardStore()
  const [localGrades, setLocalGrades] = useState<LocalGrade[]>(grades)
  const [expanded, setExpanded] = useState<number | null>(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Subject tag input per grade
  const [subjectInputs, setSubjectInputs] = useState<Record<number, string>>({})

  const supabase = createClient()

  function addGrade() {
    const idx = localGrades.length
    setLocalGrades((g) => [...g, { name: '', subjects: [], sections: [] }])
    setExpanded(idx)
  }

  function removeGrade(idx: number) {
    setLocalGrades((g) => g.filter((_, i) => i !== idx))
  }

  function updateGradeName(idx: number, name: string) {
    setLocalGrades((g) => g.map((grade, i) => (i === idx ? { ...grade, name } : grade)))
  }

  function addSubjectToGrade(gradeIdx: number) {
    const val = (subjectInputs[gradeIdx] ?? '').trim()
    if (!val) return
    setLocalGrades((g) =>
      g.map((grade, i) =>
        i === gradeIdx && !grade.subjects.includes(val)
          ? { ...grade, subjects: [...grade.subjects, val] }
          : grade
      )
    )
    setSubjectInputs((s) => ({ ...s, [gradeIdx]: '' }))
  }

  function removeSubjectFromGrade(gradeIdx: number, subject: string) {
    setLocalGrades((g) =>
      g.map((grade, i) =>
        i === gradeIdx
          ? { ...grade, subjects: grade.subjects.filter((s) => s !== subject) }
          : grade
      )
    )
  }

  function addSection(gradeIdx: number) {
    setLocalGrades((g) =>
      g.map((grade, i) =>
        i === gradeIdx
          ? {
              ...grade,
              sections: [
                ...grade.sections,
                { name: '', classTeacher: null, homeroomFirst: false },
              ],
            }
          : grade
      )
    )
  }

  function removeSection(gradeIdx: number, secIdx: number) {
    setLocalGrades((g) =>
      g.map((grade, i) =>
        i === gradeIdx
          ? { ...grade, sections: grade.sections.filter((_, j) => j !== secIdx) }
          : grade
      )
    )
  }

  function updateSection(gradeIdx: number, secIdx: number, field: string, value: string | boolean | null) {
    setLocalGrades((g) =>
      g.map((grade, i) =>
        i === gradeIdx
          ? {
              ...grade,
              sections: grade.sections.map((s, j) =>
                j === secIdx ? { ...s, [field]: value } : s
              ),
            }
          : grade
      )
    )
  }

  async function handleNext() {
    const filtered = localGrades.filter((g) => g.name.trim())
    setGrades(filtered)

    if (!schoolId) {
      setStep(6)
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Step A: Delete existing grades (sections cascade-delete) and subjects
      await supabase.from('grades').delete().eq('school_id', schoolId)
      await supabase.from('subjects').delete().eq('school_id', schoolId)

      // Step B: Collect all unique subject names across all grades
      const allSubjectNames = [
        ...new Set(filtered.flatMap((g) => g.subjects.filter((s) => s.trim()))),
      ]

      // Step C: Insert subjects
      let subjectMap: Record<string, string> = {}  // name -> id
      if (allSubjectNames.length > 0) {
        const { data: subjectRecords } = await supabase
          .from('subjects')
          .insert(allSubjectNames.map((name) => ({ school_id: schoolId, name })))
          .select()
        if (subjectRecords) {
          subjectMap = Object.fromEntries(subjectRecords.map((s) => [s.name, s.id]))
        }
      }

      // Step D: Insert grades, sections, grade_subjects
      for (let gi = 0; gi < filtered.length; gi++) {
        const grade = filtered[gi]

        const { data: g } = await supabase
          .from('grades')
          .insert({ school_id: schoolId, name: grade.name, order_index: gi })
          .select()
          .single()

        if (!g) continue

        // Insert sections
        const validSections = grade.sections.filter((s) => s.name.trim())
        if (validSections.length > 0) {
          await supabase.from('sections').insert(
            validSections.map((section) => ({
              grade_id: g.id,
              name: section.name,
              class_teacher_period_first: section.homeroomFirst,
            }))
          )
        }

        // Insert grade_subjects (requires migration 005 — skip gracefully if table doesn't exist)
        const gradeSubjectInserts = grade.subjects
          .filter((name) => subjectMap[name])
          .map((name) => ({
            school_id: schoolId,
            grade_id: g.id,
            subject_id: subjectMap[name],
          }))

        if (gradeSubjectInserts.length > 0) {
          // Ignore error if table doesn't exist yet (migration 005 pending)
          await supabase.from('grade_subjects').insert(gradeSubjectInserts).then(() => {})
        }
      }
    } catch {
      setError('Something went wrong saving grades. Please try again.')
      setSaving(false)
      return
    }

    setSaving(false)
    setStep(6)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cormorant text-3xl font-semibold text-espresso mb-2">Grades & Sections</h2>
        <p className="text-taupe">Define your grade levels, their subjects, and section structure.</p>
      </div>

      <div className="space-y-3">
        {localGrades.map((grade, gi) => (
          <div key={gi} className="border border-sand rounded-xl overflow-hidden">
            {/* Grade header */}
            <div
              className="flex items-center gap-3 p-4 bg-cream/50 cursor-pointer"
              onClick={() => setExpanded(expanded === gi ? null : gi)}
            >
              {expanded === gi ? (
                <ChevronDown className="h-4 w-4 text-taupe flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-taupe flex-shrink-0" />
              )}
              <Input
                value={grade.name}
                onChange={(e) => { e.stopPropagation(); updateGradeName(gi, e.target.value) }}
                placeholder="e.g. Grade 6"
                onClick={(e) => e.stopPropagation()}
                className="flex-1"
              />
              <span className="text-xs text-taupe flex-shrink-0">
                {grade.sections.length} section{grade.sections.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); removeGrade(gi) }}
                className="text-red-500 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {expanded === gi && (
              <div className="p-4 space-y-5 bg-ivory/50">

                {/* ── Subjects subsection ── */}
                <div>
                  <p className="text-xs font-semibold text-espresso uppercase tracking-wider mb-3">Subjects</p>
                  {/* Pill display */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {grade.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'rgba(181,169,159,0.25)',
                          color: 'var(--color-brand-mocha)',
                          fontFamily: 'var(--font-mono)',
                          border: '0.5px solid rgba(181,169,159,0.4)',
                        }}
                      >
                        {sub}
                        <button
                          onClick={() => removeSubjectFromGrade(gi, sub)}
                          className="transition-opacity hover:opacity-60"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {/* Add subject input */}
                  <div className="flex gap-2">
                    <input
                      value={subjectInputs[gi] ?? ''}
                      onChange={(e) => setSubjectInputs((s) => ({ ...s, [gi]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubjectToGrade(gi) } }}
                      placeholder="e.g. Mathematics"
                      className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none border border-sand bg-ivory text-espresso"
                    />
                    <Button variant="secondary" size="sm" onClick={() => addSubjectToGrade(gi)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-sand/60" />

                {/* ── Sections subsection ── */}
                <div>
                  <p className="text-xs font-semibold text-espresso uppercase tracking-wider mb-3">Sections</p>
                  <div className="space-y-2">
                    {grade.sections.map((section, si) => (
                      <div key={si} className="flex gap-3 items-end bg-cream rounded-xl p-3">
                        <Input
                          label="Section"
                          value={section.name}
                          onChange={(e) => updateSection(gi, si, 'name', e.target.value)}
                          placeholder="e.g. A"
                          className="w-24"
                        />
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            id={`homeroom-${gi}-${si}`}
                            checked={section.homeroomFirst}
                            onChange={(e) => updateSection(gi, si, 'homeroomFirst', e.target.checked)}
                            className="rounded border-sand"
                          />
                          <label htmlFor={`homeroom-${gi}-${si}`} className="text-sm text-espresso">
                            Homeroom first
                          </label>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(gi, si)}
                          className="mb-0.5 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => addSection(gi)}
                    className="w-full mt-2"
                  >
                    <Plus className="h-4 w-4" /> Add section
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        <Button variant="secondary" onClick={addGrade} className="w-full">
          <Plus className="h-4 w-4" /> Add grade
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(4)}>Back</Button>
        <Button onClick={handleNext} loading={saving}>Continue</Button>
      </div>
    </div>
  )
}
