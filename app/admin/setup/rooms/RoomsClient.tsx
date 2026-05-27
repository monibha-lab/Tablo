'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'

/* ─── types ─────────────────────────────────────────────── */

interface Grade {
  id: string
  name: string
  order_index: number
}

interface Section {
  id: string
  grade_id: string
  name: string
  class_teacher_id: string | null
  teachers?: { name: string } | null
}

interface Teacher {
  id: string
  name: string
}

interface GradesClientProps {
  grades: Grade[]
  sections: Section[]
  teachers: Teacher[]
  schoolId: string
}

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' }
const serif: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' }

/* ─── component ─────────────────────────────────────────── */

export function RoomsClient({ grades, sections, teachers, schoolId }: GradesClientProps) {
  const [expanded, setExpanded] = useState<string | null>(grades[0]?.id ?? null)

  // Grade modal
  const [gradePanel, setGradePanel] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [gradeName, setGradeName] = useState('')
  const [deleteGradeId, setDeleteGradeId] = useState<string | null>(null)

  // Section modal
  const [sectionPanel, setSectionPanel] = useState<{ gradeId: string } | null>(null)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [sectionName, setSectionName] = useState('')
  const [sectionTeacher, setSectionTeacher] = useState('')
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  // ── Grade CRUD ──────────────────────────────────────────

  function openAddGrade() {
    setEditingGrade(null)
    setGradeName('')
    setGradePanel(true)
  }

  function openEditGrade(g: Grade) {
    setEditingGrade(g)
    setGradeName(g.name)
    setGradePanel(true)
  }

  async function handleSaveGrade() {
    if (!gradeName.trim()) return
    setSaving(true)

    if (editingGrade) {
      await supabase.from('grades').update({ name: gradeName }).eq('id', editingGrade.id)
      toast({ variant: 'success', title: 'Grade updated' })
    } else {
      const maxOrder = Math.max(0, ...grades.map((g) => g.order_index))
      await supabase.from('grades').insert({
        school_id: schoolId,
        name: gradeName,
        order_index: maxOrder + 1,
      })
      toast({ variant: 'success', title: 'Grade added' })
    }

    setSaving(false)
    setGradePanel(false)
    router.refresh()
  }

  async function handleDeleteGrade() {
    if (!deleteGradeId) return
    await supabase.from('grades').delete().eq('id', deleteGradeId)
    setDeleteGradeId(null)
    router.refresh()
  }

  // ── Section CRUD ────────────────────────────────────────

  function openAddSection(gradeId: string) {
    setEditingSection(null)
    setSectionName('')
    setSectionTeacher('')
    setSectionPanel({ gradeId })
  }

  function openEditSection(s: Section) {
    setEditingSection(s)
    setSectionName(s.name)
    setSectionTeacher(s.class_teacher_id ?? '')
    setSectionPanel({ gradeId: s.grade_id })
  }

  async function handleSaveSection() {
    if (!sectionName.trim() || !sectionPanel) return
    setSaving(true)

    const payload = {
      name: sectionName,
      class_teacher_id: sectionTeacher || null,
    }

    if (editingSection) {
      await supabase.from('sections').update(payload).eq('id', editingSection.id)
      toast({ variant: 'success', title: 'Section updated' })
    } else {
      await supabase.from('sections').insert({
        school_id: schoolId,
        grade_id: sectionPanel.gradeId,
        ...payload,
      })
      toast({ variant: 'success', title: 'Section added' })
    }

    setSaving(false)
    setSectionPanel(null)
    router.refresh()
  }

  async function handleDeleteSection() {
    if (!deleteSectionId) return
    await supabase.from('sections').delete().eq('id', deleteSectionId)
    setDeleteSectionId(null)
    router.refresh()
  }

  return (
    <div>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ ...serif, color: 'var(--color-brand-mocha)' }}>
            Grades & Sections
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
            {grades.length} grade{grades.length !== 1 ? 's' : ''} · {sections.length} section{sections.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAddGrade}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75"
          style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Grade
        </button>
      </div>

      {/* ── Grade list ──────────────────────────────────── */}
      {grades.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
        >
          <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--color-brand-mocha)' }} />
          <p className="text-sm uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
            No grades yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grades.map((grade) => {
            const gradeSections = sections.filter((s) => s.grade_id === grade.id)
            const isOpen = expanded === grade.id
            return (
              <div
                key={grade.id}
                className="rounded-xl overflow-hidden"
                style={{ border: '0.5px solid var(--color-brand-sand)' }}
              >
                {/* Grade row */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors"
                  style={{ backgroundColor: isOpen ? 'var(--color-brand-champagne)' : 'var(--color-brand-cream)' }}
                  onClick={() => setExpanded(isOpen ? null : grade.id)}
                >
                  <span style={{ color: 'var(--color-brand-taupe)' }}>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                  <span className="flex-1 font-medium text-sm" style={{ color: 'var(--color-brand-mocha)' }}>
                    {grade.name}
                  </span>
                  <span className="text-xs mr-3" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                    {gradeSections.length} section{gradeSections.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-1.5 rounded-full transition-opacity hover:opacity-70"
                      style={{ color: 'var(--color-brand-taupe)' }}
                      onClick={() => openEditGrade(grade)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-full transition-opacity hover:opacity-70"
                      style={{ color: 'var(--color-brand-taupe)' }}
                      onClick={() => setDeleteGradeId(grade.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sections */}
                {isOpen && (
                  <div className="px-5 py-4 space-y-2" style={{ backgroundColor: 'var(--color-brand-linen)' }}>
                    {gradeSections.length === 0 ? (
                      <p className="text-xs pb-1" style={{ ...mono, color: 'var(--color-brand-clay)' }}>
                        No sections yet
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                        {gradeSections.map((sec) => (
                          <div
                            key={sec.id}
                            className="flex items-center justify-between px-4 py-3 rounded-xl"
                            style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
                          >
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--color-brand-mocha)' }}>
                                {grade.name} — {sec.name}
                              </p>
                              {sec.teachers?.name && (
                                <p className="text-[10px] mt-0.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                                  {sec.teachers.name}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                className="p-1.5 rounded-full transition-opacity hover:opacity-70"
                                style={{ color: 'var(--color-brand-taupe)' }}
                                onClick={() => openEditSection(sec)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                className="p-1.5 rounded-full transition-opacity hover:opacity-70"
                                style={{ color: 'var(--color-brand-taupe)' }}
                                onClick={() => setDeleteSectionId(sec.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => openAddSection(grade.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                      style={{
                        ...mono,
                        border: '0.5px dashed var(--color-brand-sand)',
                        color: 'var(--color-brand-taupe)',
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Add Section
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Grade panel ─────────────────────────────────── */}
      {gradePanel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setGradePanel(false)} />
          <div
            className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit rounded-2xl p-6"
            style={{ backgroundColor: 'var(--color-brand-linen)', border: '0.5px solid var(--color-brand-sand)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>
                {editingGrade ? 'Edit Grade' : 'Add Grade'}
              </span>
              <button onClick={() => setGradePanel(false)} style={{ color: 'var(--color-brand-taupe)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                  Grade Name
                </label>
                <input
                  value={gradeName}
                  onChange={(e) => setGradeName(e.target.value)}
                  placeholder="e.g. Grade 5 or Nursery"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-brand-cream)',
                    border: '0.5px solid var(--color-brand-sand)',
                    color: 'var(--color-brand-mocha)',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGrade()}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setGradePanel(false)}
                  className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest transition-opacity hover:opacity-70"
                  style={{ ...mono, backgroundColor: 'var(--color-brand-cream)', color: 'var(--color-brand-taupe)', border: '0.5px solid var(--color-brand-sand)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGrade}
                  disabled={saving || !gradeName.trim()}
                  className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75 disabled:opacity-40"
                  style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
                >
                  {saving ? 'Saving…' : editingGrade ? 'Save' : 'Add Grade'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Section panel ───────────────────────────────── */}
      {sectionPanel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setSectionPanel(null)} />
          <div
            className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit rounded-2xl p-6"
            style={{ backgroundColor: 'var(--color-brand-linen)', border: '0.5px solid var(--color-brand-sand)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>
                {editingSection ? 'Edit Section' : 'Add Section'}
              </span>
              <button onClick={() => setSectionPanel(null)} style={{ color: 'var(--color-brand-taupe)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                  Section Name
                </label>
                <input
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="e.g. A or Rose"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-brand-cream)',
                    border: '0.5px solid var(--color-brand-sand)',
                    color: 'var(--color-brand-mocha)',
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                  Class Teacher (optional)
                </label>
                <select
                  value={sectionTeacher}
                  onChange={(e) => setSectionTeacher(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-brand-cream)',
                    border: '0.5px solid var(--color-brand-sand)',
                    color: 'var(--color-brand-mocha)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <option value="">— None —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSectionPanel(null)}
                  className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest transition-opacity hover:opacity-70"
                  style={{ ...mono, backgroundColor: 'var(--color-brand-cream)', color: 'var(--color-brand-taupe)', border: '0.5px solid var(--color-brand-sand)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSection}
                  disabled={saving || !sectionName.trim()}
                  className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75 disabled:opacity-40"
                  style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
                >
                  {saving ? 'Saving…' : editingSection ? 'Save' : 'Add Section'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Confirm modals ──────────────────────────────── */}
      <ConfirmModal
        open={!!deleteGradeId}
        onClose={() => setDeleteGradeId(null)}
        onConfirm={handleDeleteGrade}
        title="Delete grade"
        description="This will also delete all sections in this grade. Existing timetable slots won't be affected."
        confirmLabel="Delete"
        danger
      />
      <ConfirmModal
        open={!!deleteSectionId}
        onClose={() => setDeleteSectionId(null)}
        onConfirm={handleDeleteSection}
        title="Delete section"
        description="This section will be removed. Existing timetable assignments won't be affected."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
