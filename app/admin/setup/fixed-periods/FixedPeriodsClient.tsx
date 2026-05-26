'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Subject, Room } from '@/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

interface FixedPeriodsClientProps {
  fixedPeriods: unknown[]
  subjects: Subject[]
  teachers: { id: string; name: string }[]
  rooms: Room[]
  sections: unknown[]
  grades: unknown[]
  schoolId: string
}

export function FixedPeriodsClient({
  fixedPeriods,
  subjects,
  teachers,
  rooms,
  sections,
  grades,
  schoolId,
}: FixedPeriodsClientProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [appliesTo, setAppliesTo] = useState<'section' | 'grade' | 'school'>('section')
  const [sectionId, setSectionId] = useState('')
  const [gradeId, setGradeId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [slotNumber, setSlotNumber] = useState(1)
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [label, setLabel] = useState('')
  const [isLastPeriod, setIsLastPeriod] = useState(false)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    await supabase.from('fixed_periods').insert({
      school_id: schoolId,
      applies_to: appliesTo,
      section_id: appliesTo === 'section' ? sectionId || null : null,
      grade_id: appliesTo === 'grade' ? gradeId || null : null,
      day_of_week: dayOfWeek,
      slot_number: slotNumber,
      subject_id: subjectId || null,
      teacher_id: teacherId || null,
      room_id: roomId || null,
      label: label || null,
      is_last_period: isLastPeriod,
    })
    toast({ variant: 'success', title: 'Fixed period added' })
    setSaving(false); setPanelOpen(false); router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('fixed_periods').delete().eq('id', deleteId)
    setDeleteId(null); toast({ variant: 'success', title: 'Fixed period removed' }); router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Fixed Periods</h1>
          <p className="text-taupe">Periods that are locked into specific slots.</p>
        </div>
        <Button onClick={() => setPanelOpen(true)}><Plus className="h-4 w-4" /> Add fixed period</Button>
      </div>

      <div className="space-y-3">
        {(fixedPeriods as {
          id: string; applies_to: string; day_of_week: number | null; slot_number: number | null;
          label: string | null; is_last_period: boolean;
          subjects: { name: string } | null; teachers: { name: string } | null;
          rooms: { name: string } | null; sections: { name: string } | null;
          grades: { name: string } | null;
        }[]).map((fp) => (
          <div key={fp.id} className="bg-ivory border border-sand/60 rounded-xl p-4 flex items-center gap-4">
            <Lock className="h-4 w-4 text-taupe flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-espresso">
                  {fp.subjects?.name ?? fp.label ?? 'Unlabelled slot'}
                </span>
                <Badge size="sm">{fp.applies_to}</Badge>
                {fp.is_last_period && <Badge size="sm" variant="warning">Last period</Badge>}
              </div>
              <p className="text-xs text-taupe mt-0.5">
                {fp.day_of_week ? DAYS[fp.day_of_week - 1] : 'Any day'} · Period {fp.slot_number ?? '—'}
                {fp.teachers?.name && ` · ${fp.teachers.name}`}
                {fp.rooms?.name && ` · ${fp.rooms.name}`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(fp.id)}>
              <Trash2 className="h-4 w-4 text-clay" />
            </Button>
          </div>
        ))}
        {fixedPeriods.length === 0 && (
          <div className="text-center py-16 text-taupe">No fixed periods yet.</div>
        )}
      </div>

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Add fixed period"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Add</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select label="Scope" value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as 'section' | 'grade' | 'school')}>
            <option value="section">Specific section</option>
            <option value="grade">Entire grade</option>
            <option value="school">Whole school</option>
          </Select>
          {appliesTo === 'section' && (
            <Select label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">Select section</option>
              {(sections as { id: string; name: string; grades: { name: string } | null }[]).map((s) => (
                <option key={s.id} value={s.id}>{s.grades?.name} {s.name}</option>
              ))}
            </Select>
          )}
          {appliesTo === 'grade' && (
            <Select label="Grade" value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              <option value="">Select grade</option>
              {(grades as { id: string; name: string }[]).map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Select label="Day" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {DAYS.map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
            </Select>
            <Input label="Period slot" type="number" value={slotNumber} onChange={(e) => setSlotNumber(Number(e.target.value))} min={1} />
          </div>
          <Select label="Subject (optional)" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">— None —</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select label="Teacher (optional)" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">— None —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Select label="Room (optional)" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">— None —</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Input label="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Assembly" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="last-period" checked={isLastPeriod} onChange={(e) => setIsLastPeriod(e.target.checked)} className="rounded border-sand" />
            <label htmlFor="last-period" className="text-sm text-espresso">Apply to last period of day</label>
          </div>
        </div>
      </SlidePanel>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Remove fixed period" description="This fixed period rule will be removed." confirmLabel="Remove" danger />
    </div>
  )
}
