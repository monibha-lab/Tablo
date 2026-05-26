'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWizardStore } from '@/lib/store/wizard-store'

export function Step5Grades() {
  const { grades, setGrades, setStep } = useWizardStore()
  const [localGrades, setLocalGrades] = useState(grades)
  const [expanded, setExpanded] = useState<number | null>(0)

  function addGrade() {
    const idx = localGrades.length
    setLocalGrades((g) => [...g, { name: '', sections: [] }])
    setExpanded(idx)
  }

  function removeGrade(idx: number) {
    setLocalGrades((g) => g.filter((_, i) => i !== idx))
  }

  function updateGradeName(idx: number, name: string) {
    setLocalGrades((g) => g.map((grade, i) => (i === idx ? { ...grade, name } : grade)))
  }

  function addSection(gradeIdx: number) {
    setLocalGrades((g) =>
      g.map((grade, i) =>
        i === gradeIdx
          ? {
              ...grade,
              sections: [
                ...grade.sections,
                { name: '', classTeacher: null, homeroomFirst: false, subjects: [] },
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

  function handleNext() {
    setGrades(localGrades.filter((g) => g.name.trim()))
    setStep(6)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cormorant text-3xl font-semibold text-espresso mb-2">Grades & Sections</h2>
        <p className="text-taupe">Define your school&apos;s grade levels and section structure.</p>
      </div>

      <div className="space-y-3">
        {localGrades.map((grade, gi) => (
          <div key={gi} className="border border-sand rounded-xl overflow-hidden">
            <div
              className="flex items-center gap-3 p-4 bg-cream/50 cursor-pointer"
              onClick={() => setExpanded(expanded === gi ? null : gi)}
            >
              {expanded === gi ? (
                <ChevronDown className="h-4 w-4 text-taupe" />
              ) : (
                <ChevronRight className="h-4 w-4 text-taupe" />
              )}
              <Input
                value={grade.name}
                onChange={(e) => { e.stopPropagation(); updateGradeName(gi, e.target.value) }}
                placeholder="e.g. Grade 6"
                onClick={(e) => e.stopPropagation()}
                className="flex-1"
              />
              <span className="text-xs text-taupe">{grade.sections.length} section(s)</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); removeGrade(gi) }}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {expanded === gi && (
              <div className="p-4 space-y-3">
                {grade.sections.map((section, si) => (
                  <div key={si} className="flex gap-3 items-end bg-ivory rounded-xl p-3">
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

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addSection(gi)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" /> Add section
                </Button>
              </div>
            )}
          </div>
        ))}

        <Button variant="secondary" onClick={addGrade} className="w-full">
          <Plus className="h-4 w-4" /> Add grade
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(4)}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  )
}
