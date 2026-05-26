'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Subject, Room } from '@/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

interface ElectivesClientProps {
  blocks: unknown[]
  subjects: Subject[]
  teachers: { id: string; name: string }[]
  rooms: Room[]
  sections: { id: string; name: string; grades: { name: string } | null }[]
  schoolId: string
}

export function ElectivesClient({ blocks, subjects, teachers, rooms, sections, schoolId }: ElectivesClientProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [blockName, setBlockName] = useState('')
  const [blockDay, setBlockDay] = useState(1)
  const [blockSlot, setBlockSlot] = useState(1)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  async function handleCreateBlock() {
    if (!blockName) return
    setSaving(true)
    await supabase.from('elective_blocks').insert({
      school_id: schoolId,
      name: blockName,
      day_of_week: blockDay,
      slot_number: blockSlot,
    })
    toast({ variant: 'success', title: 'Elective block created' })
    setSaving(false); setPanelOpen(false)
    setBlockName(''); setBlockDay(1); setBlockSlot(1)
    router.refresh()
  }

  async function addOffering(blockId: string, subjectId: string, teacherId: string, roomId: string) {
    await supabase.from('elective_offerings').insert({
      elective_block_id: blockId,
      subject_id: subjectId,
      teacher_id: teacherId || null,
      room_id: roomId || null,
    })
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('elective_blocks').delete().eq('id', deleteId)
    setDeleteId(null); toast({ variant: 'success', title: 'Elective block removed' }); router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Elective Blocks</h1>
          <p className="text-taupe">Configurable elective periods where students choose subjects.</p>
        </div>
        <Button onClick={() => setPanelOpen(true)}><Plus className="h-4 w-4" /> Add block</Button>
      </div>

      <div className="space-y-3">
        {(blocks as {
          id: string; name: string; day_of_week: number; slot_number: number;
          elective_offerings: { id: string; subjects: { name: string } | null; teachers: { name: string } | null; rooms: { name: string } | null }[];
        }[]).map((block) => (
          <div key={block.id} className="border border-sand/60 rounded-xl overflow-hidden">
            <div
              className="flex items-center gap-3 p-4 bg-cream/50 cursor-pointer"
              onClick={() => setExpanded(expanded === block.id ? null : block.id)}
            >
              <Zap className="h-4 w-4 text-taupe" />
              {expanded === block.id ? <ChevronDown className="h-4 w-4 text-taupe" /> : <ChevronRight className="h-4 w-4 text-taupe" />}
              <div className="flex-1">
                <p className="font-medium text-espresso">{block.name}</p>
                <p className="text-xs text-taupe">{DAYS[block.day_of_week - 1]} · Period {block.slot_number} · {block.elective_offerings.length} offerings</p>
              </div>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteId(block.id) }}>
                <Trash2 className="h-4 w-4 text-clay" />
              </Button>
            </div>

            {expanded === block.id && (
              <div className="p-4 space-y-3 bg-ivory">
                {block.elective_offerings.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 p-3 bg-cream/50 rounded-xl text-sm">
                    <div className="flex-1">
                      <span className="font-medium text-espresso">{o.subjects?.name}</span>
                      {o.teachers?.name && <span className="text-taupe ml-2">· {o.teachers.name}</span>}
                      {o.rooms?.name && <span className="text-taupe ml-2">· {o.rooms.name}</span>}
                    </div>
                  </div>
                ))}
                <OfferingForm
                  subjects={subjects}
                  teachers={teachers}
                  rooms={rooms}
                  onAdd={(subjectId, teacherId, roomId) => addOffering(block.id, subjectId, teacherId, roomId)}
                />
              </div>
            )}
          </div>
        ))}
        {blocks.length === 0 && <div className="text-center py-16 text-taupe">No elective blocks yet.</div>}
      </div>

      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="Add elective block"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBlock} loading={saving}>Create block</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Block name" value={blockName} onChange={(e) => setBlockName(e.target.value)} placeholder="e.g. Grade 8 Electives" required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Day" value={blockDay} onChange={(e) => setBlockDay(Number(e.target.value))}>
              {DAYS.map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
            </Select>
            <Input label="Period slot" type="number" value={blockSlot} onChange={(e) => setBlockSlot(Number(e.target.value))} min={1} />
          </div>
        </div>
      </SlidePanel>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Remove elective block" description="All offerings and enrollments for this block will be removed." confirmLabel="Remove" danger />
    </div>
  )
}

function OfferingForm({
  subjects,
  teachers,
  rooms,
  onAdd,
}: {
  subjects: Subject[]
  teachers: { id: string; name: string }[]
  rooms: Room[]
  onAdd: (subjectId: string, teacherId: string, roomId: string) => void
}) {
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [roomId, setRoomId] = useState('')

  return (
    <div className="flex gap-2 items-end border-t border-sand/40 pt-3">
      <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="flex-1">
        <option value="">Select subject</option>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <Select label="Teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="flex-1">
        <option value="">— Any —</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </Select>
      <Button size="sm" disabled={!subjectId} onClick={() => { onAdd(subjectId, teacherId, roomId); setSubjectId(''); setTeacherId(''); setRoomId('') }}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  )
}
