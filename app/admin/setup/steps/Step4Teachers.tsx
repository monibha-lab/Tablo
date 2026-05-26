'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWizardStore } from '@/lib/store/wizard-store'

interface ImportRow {
  Name: string
  Email: string
  Subjects: string
  Grades: string
  MaxPeriods: number
}

export function Step4Teachers() {
  const { teachers, setTeachers, setStep } = useWizardStore()
  const [localTeachers, setLocalTeachers] = useState(teachers)
  const [importPreview, setImportPreview] = useState<ImportRow[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function addTeacher() {
    setLocalTeachers((t) => [
      ...t,
      { name: '', email: '', subjects: [], grades: [], maxPeriods: 6 },
    ])
  }

  function updateTeacher(idx: number, field: string, value: string | number) {
    setLocalTeachers((t) => t.map((teacher, i) => (i === idx ? { ...teacher, [field]: value } : teacher)))
  }

  function removeTeacher(idx: number) {
    setLocalTeachers((t) => t.filter((_, i) => i !== idx))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = ev.target?.result
      const wb = XLSX.read(data, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<ImportRow>(ws)
      setImportPreview(rows)
    }
    reader.readAsBinaryString(file)
  }

  function confirmImport() {
    if (!importPreview) return
    const imported = importPreview.map((row) => ({
      name: row.Name || '',
      email: row.Email || '',
      subjects: row.Subjects ? String(row.Subjects).split(',').map((s) => s.trim()) : [],
      grades: row.Grades ? String(row.Grades).split(',').map((g) => g.trim()) : [],
      maxPeriods: Number(row.MaxPeriods) || 6,
    }))
    setLocalTeachers((t) => [...t, ...imported])
    setImportPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleNext() {
    setTeachers(localTeachers.filter((t) => t.name.trim() && t.email.trim()))
    setStep(5)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cormorant text-3xl font-semibold text-espresso mb-2">Teachers</h2>
        <p className="text-taupe">Add teachers manually or import from an Excel file.</p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" /> Import from Excel
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {importPreview && (
        <div className="bg-cream/50 rounded-xl p-4 border border-sand">
          <p className="text-sm font-medium text-espresso mb-3">
            Preview — {importPreview.length} teachers found
          </p>
          <div className="overflow-x-auto max-h-48">
            <table className="text-xs w-full">
              <thead>
                <tr className="text-taupe border-b border-sand">
                  <th className="text-left py-1.5 pr-4">Name</th>
                  <th className="text-left py-1.5 pr-4">Email</th>
                  <th className="text-left py-1.5 pr-4">Subjects</th>
                  <th className="text-left py-1.5">Max Periods</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.map((row, i) => (
                  <tr key={i} className="border-b border-sand/40 last:border-0">
                    <td className="py-1.5 pr-4 text-espresso">{row.Name}</td>
                    <td className="py-1.5 pr-4 text-taupe">{row.Email}</td>
                    <td className="py-1.5 pr-4 text-taupe">{row.Subjects}</td>
                    <td className="py-1.5 text-taupe">{row.MaxPeriods}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={confirmImport}>Confirm import</Button>
            <Button size="sm" variant="secondary" onClick={() => setImportPreview(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {localTeachers.map((teacher, i) => (
          <div key={i} className="flex gap-3 items-end bg-cream/50 rounded-xl p-4">
            <Input
              label="Name"
              value={teacher.name}
              onChange={(e) => updateTeacher(i, 'name', e.target.value)}
              placeholder="Full name"
              className="flex-1"
            />
            <Input
              label="Email"
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
              className="w-24"
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
        ))}

        <Button variant="secondary" onClick={addTeacher} className="w-full">
          <Plus className="h-4 w-4" /> Add teacher
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(3)}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  )
}
