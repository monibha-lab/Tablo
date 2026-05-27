'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Subject } from '@/types'

const PRESET_COLORS = [
  '#E8D0C8', '#F0E4CC', '#E8D8CC', '#D4C8B0',
  '#C4B49A', '#D0E8D8', '#C8D8E8', '#E0D8E8',
  '#F0EAD8', '#D8E8D0', '#E8E0D0', '#DDD4C0',
]

interface SubjectsClientProps {
  subjects: Subject[]
  sections: unknown[]
  schoolId: string
}

const mono:  React.CSSProperties = { fontFamily: 'var(--font-mono)' }
const serif: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' }

export function SubjectsClient({ subjects, schoolId }: SubjectsClientProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  function openAdd() {
    setEditing(null)
    setName('')
    setColor(PRESET_COLORS[0])
    setPanelOpen(true)
  }

  function openEdit(s: Subject) {
    setEditing(s)
    setName(s.name)
    setColor(s.color_hex ?? PRESET_COLORS[0])
    setPanelOpen(true)
  }

  async function handleSave() {
    if (!name) return
    setSaving(true)
    if (editing) {
      await supabase.from('subjects').update({ name, color_hex: color }).eq('id', editing.id)
      toast({ variant: 'success', title: 'Subject updated' })
    } else {
      await supabase.from('subjects').insert({ school_id: schoolId, name, color_hex: color })
      toast({ variant: 'success', title: 'Subject added' })
    }
    setSaving(false)
    setPanelOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('subjects').delete().eq('id', deleteId)
    setDeleteId(null)
    toast({ variant: 'success', title: 'Subject deleted' })
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ ...serif, color: 'var(--color-brand-mocha)' }}>
            Subjects
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75"
          style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Subject
        </button>
      </div>

      {/* Grid of subjects */}
      {subjects.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
        >
          <p className="text-sm uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
            No subjects yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 px-5 py-4 rounded-xl"
              style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
            >
              {/* Color swatch */}
              <div
                className="h-8 w-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: s.color_hex ?? '#E8E0D0' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-brand-mocha)' }}>
                  {s.name}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  className="p-1.5 rounded-full transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-brand-taupe)' }}
                  onClick={() => openEdit(s)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  className="p-1.5 rounded-full transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-brand-taupe)' }}
                  onClick={() => setDeleteId(s.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div
            className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit rounded-2xl p-6"
            style={{ backgroundColor: 'var(--color-brand-linen)', border: '0.5px solid var(--color-brand-sand)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-bold uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>
                {editing ? 'Edit Subject' : 'Add Subject'}
              </span>
              <button onClick={() => setPanelOpen(false)} style={{ color: 'var(--color-brand-taupe)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                  Subject Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-brand-cream)',
                    border: '0.5px solid var(--color-brand-sand)',
                    color: 'var(--color-brand-mocha)',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                  Colour
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        border: color === c
                          ? '2.5px solid var(--color-brand-mocha)'
                          : '1.5px solid var(--color-brand-sand)',
                        transform: color === c ? 'scale(1.15)' : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest transition-opacity hover:opacity-70"
                  style={{ ...mono, backgroundColor: 'var(--color-brand-cream)', color: 'var(--color-brand-taupe)', border: '0.5px solid var(--color-brand-sand)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="flex-1 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75 disabled:opacity-40"
                  style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
                >
                  {saving ? 'Saving…' : editing ? 'Save' : 'Add Subject'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete subject"
        description="This subject will be removed. Existing timetable slots won't be affected."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
