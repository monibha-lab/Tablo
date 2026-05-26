'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Subject } from '@/types'

const PRESET_COLORS = [
  '#E8E0D0', '#F0E4CC', '#E8D8CC', '#D4C8B0',
  '#C4B49A', '#B8A898', '#9C8878', '#8C7868',
  '#E8D0D0', '#D0E8D8', '#D0D8E8', '#E8E8D0',
]

const SUBJECT_TYPES = ['academic', 'lab', 'sports', 'elective', 'homeroom'] as const

interface SubjectsClientProps {
  subjects: Subject[]
  sections: unknown[]
  schoolId: string
}

export function SubjectsClient({ subjects, schoolId }: SubjectsClientProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<(typeof SUBJECT_TYPES)[number]>('academic')
  const [color, setColor] = useState('#E8E0D0')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  function openAdd() {
    setEditing(null); setName(''); setType('academic'); setColor('#E8E0D0'); setPanelOpen(true)
  }

  function openEdit(s: Subject) {
    setEditing(s); setName(s.name); setType(s.type as (typeof SUBJECT_TYPES)[number]); setColor(s.color_hex); setPanelOpen(true)
  }

  async function handleSave() {
    if (!name) return
    setSaving(true)
    if (editing) {
      await supabase.from('subjects').update({ name, type, color_hex: color }).eq('id', editing.id)
      toast({ variant: 'success', title: 'Subject updated' })
    } else {
      await supabase.from('subjects').insert({ school_id: schoolId, name, type, color_hex: color })
      toast({ variant: 'success', title: 'Subject added' })
    }
    setSaving(false); setPanelOpen(false); router.refresh()
  }

  async function handleColorChange(subjectId: string, colorHex: string) {
    await supabase.from('subjects').update({ color_hex: colorHex }).eq('id', subjectId)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('subjects').delete().eq('id', deleteId)
    setDeleteId(null); toast({ variant: 'success', title: 'Subject deleted' }); router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Subjects</h1>
          <p className="text-taupe">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add subject</Button>
      </div>

      <div className="bg-ivory border border-sand/60 rounded-2xl overflow-hidden">
        {subjects.length === 0 ? (
          <div className="text-center py-16 text-taupe">No subjects yet.</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-sand/40">
              <tr>
                <th className="text-left text-xs font-medium text-taupe px-6 py-3">Subject</th>
                <th className="text-left text-xs font-medium text-taupe px-6 py-3 hidden sm:table-cell">Type</th>
                <th className="text-left text-xs font-medium text-taupe px-6 py-3">Colour</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-b border-sand/20 last:border-0 hover:bg-cream/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-espresso">{s.name}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <Badge>{s.type}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative inline-block">
                      <button
                        className="h-7 w-7 rounded-full border-2 border-sand shadow-sm hover:scale-110 transition-transform"
                        style={{ backgroundColor: s.color_hex }}
                        title="Change colour"
                      />
                      {/* Simple color picker popover */}
                      <div className="absolute left-0 top-9 z-10 hidden group-focus-within:block bg-ivory border border-sand rounded-xl p-3 shadow-lg grid grid-cols-4 gap-2">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            className="h-6 w-6 rounded-full border border-sand/60 hover:scale-110 transition-transform"
                            style={{ backgroundColor: c }}
                            onClick={() => handleColorChange(s.id, c)}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-clay" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit subject' : 'Add subject'}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save' : 'Add subject'}</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input label="Subject name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value as (typeof SUBJECT_TYPES)[number])}>
            {SUBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <div>
            <label className="text-sm font-medium text-espresso block mb-2">Colour</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? 'border-mocha scale-110' : 'border-sand/60'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
      </SlidePanel>

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
