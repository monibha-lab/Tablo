'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Undo2, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TimetableCell } from '@/components/timetable/TimetableCell'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { Select } from '@/components/ui/Select'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import { useSaveStore } from '@/lib/store/save-store'
import type { Timetable, TimetableSlot, Section, Subject, Teacher, Room, PeriodSlot } from '@/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

interface TimetableEditorProps {
  timetable: Timetable & { terms: { name: string } | null }
  sections: Section[]
  slots: TimetableSlot[]
  subjects: Subject[]
  teachers: Teacher[]
  rooms: Room[]
  periodSlots: PeriodSlot[]
  schoolId: string
}

export function TimetableEditor({
  timetable,
  sections,
  slots: initialSlots,
  subjects,
  teachers,
  rooms,
  periodSlots,
  schoolId,
}: TimetableEditorProps) {
  const [slots, setSlots] = useState(initialSlots)
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? '')
  const [view, setView] = useState<'section' | 'teacher' | 'room'>('section')
  const [editSlot, setEditSlot] = useState<TimetableSlot | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editSubjectId, setEditSubjectId] = useState('')
  const [editTeacherId, setEditTeacherId] = useState('')
  const [editRoomId, setEditRoomId] = useState('')
  const [publishing, setPublishing] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { setSaving, setSaved } = useSaveStore()

  const periodsForSection = periodSlots.filter((p) => !p.is_break)
  const nonBreakSlots = periodsForSection.filter((p) => !p.is_break)

  function getSlot(sectionId: string, day: number, slotNumber: number) {
    return slots.find(
      (s) => s.section_id === sectionId && s.day_of_week === day && s.slot_number === slotNumber
    ) ?? null
  }

  function getSubject(id: string | null) {
    return subjects.find((s) => s.id === id) ?? null
  }

  function getTeacher(id: string | null) {
    return teachers.find((t) => t.id === id) ?? null
  }

  function getRoom(id: string | null) {
    return rooms.find((r) => r.id === id) ?? null
  }

  function openEdit(slot: TimetableSlot | null, day: number, slotNumber: number) {
    if (slot) {
      setEditSlot(slot)
      setEditSubjectId(slot.subject_id ?? '')
      setEditTeacherId(slot.teacher_id ?? '')
      setEditRoomId(slot.room_id ?? '')
    } else {
      setEditSlot({ id: '', timetable_id: timetable.id, section_id: activeSection, day_of_week: day, slot_number: slotNumber, subject_id: null, teacher_id: null, room_id: null, is_double_period: false, is_fixed: false, is_combined: false, combined_class_id: null, is_elective: false, elective_offering_id: null, is_locked: false })
      setEditSubjectId('')
      setEditTeacherId('')
      setEditRoomId('')
    }
    setEditOpen(true)
  }

  const saveEdit = useCallback(async () => {
    if (!editSlot) return
    setSaving(true)

    const updates = {
      subject_id: editSubjectId || null,
      teacher_id: editTeacherId || null,
      room_id: editRoomId || null,
    }

    if (editSlot.id) {
      await supabase.from('timetable_slots').update(updates).eq('id', editSlot.id)
      setSlots((prev) =>
        prev.map((s) => (s.id === editSlot.id ? { ...s, ...updates } : s))
      )
    } else {
      const { data } = await supabase
        .from('timetable_slots')
        .insert({
          timetable_id: timetable.id,
          section_id: editSlot.section_id,
          day_of_week: editSlot.day_of_week,
          slot_number: editSlot.slot_number,
          ...updates,
        })
        .select()
        .single()
      if (data) setSlots((prev) => [...prev, data])
    }

    setSaved()
    setEditOpen(false)
  }, [editSlot, editSubjectId, editTeacherId, editRoomId, supabase, timetable.id, setSaving, setSaved])

  async function handlePublish() {
    setPublishing(true)
    await supabase
      .from('timetables')
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq('id', timetable.id)
    toast({ variant: 'success', title: 'Timetable published' })
    setPublishing(false)
    router.refresh()
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-cormorant text-3xl font-semibold text-espresso">{timetable.label}</h1>
            <Badge variant={timetable.is_published ? 'success' : 'default'}>
              {timetable.is_published ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="text-taupe text-sm mt-1">{(timetable.terms as unknown as { name: string })?.name}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const url = `/api/export/pdf/${timetable.id}/${activeSection}`
              window.open(url, '_blank')
            }}
          >
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>
          {!timetable.is_published && (
            <Button size="sm" onClick={handlePublish} loading={publishing}>
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 mb-4 bg-cream rounded-xl p-1 w-fit">
        {(['section', 'teacher', 'room'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              view === v ? 'bg-ivory text-espresso shadow-sm' : 'text-taupe hover:text-mocha'
            }`}
          >
            By {v}
          </button>
        ))}
      </div>

      {/* Section selector */}
      {view === 'section' && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? 'bg-mocha text-ivory'
                  : 'bg-cream text-mocha hover:bg-sand/50'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Timetable grid — By Section */}
      {view === 'section' && (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th className="w-24 text-xs text-taupe font-medium text-left pb-2">Period</th>
                {DAYS.map((day) => (
                  <th key={day} className="text-xs text-taupe font-medium text-center pb-2">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nonBreakSlots.map((period) => (
                <tr key={period.slot_number}>
                  <td className="align-top">
                    <div className="pr-2">
                      <p className="text-xs font-medium text-espresso">{period.label}</p>
                      <p className="text-[10px] text-taupe">{period.start_time?.slice(0, 5)}</p>
                    </div>
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const day = dayIdx + 1
                    const slot = getSlot(activeSection, day, period.slot_number)
                    return (
                      <td key={day} className="align-top">
                        <TimetableCell
                          slot={slot}
                          subject={getSubject(slot?.subject_id ?? null)}
                          teacher={getTeacher(slot?.teacher_id ?? null)}
                          room={getRoom(slot?.room_id ?? null)}
                          onClick={() => !slot?.is_locked && openEdit(slot, day, period.slot_number)}
                          onContextMenu={(e) => { e.preventDefault(); openEdit(slot, day, period.slot_number) }}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Timetable grid — By Teacher */}
      {view === 'teacher' && (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th className="w-32 text-xs text-taupe font-medium text-left pb-2">Teacher</th>
                {DAYS.map((day) => (
                  <th key={day} className="text-xs text-taupe font-medium text-center pb-2">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="align-top pr-2">
                    <p className="text-xs font-medium text-espresso">{teacher.name}</p>
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const day = dayIdx + 1
                    const teacherSlots = slots.filter(
                      (s) => s.teacher_id === teacher.id && s.day_of_week === day
                    )
                    return (
                      <td key={day} className="align-top">
                        <div className="space-y-1">
                          {teacherSlots.length === 0 ? (
                            <div className="h-10 rounded-lg bg-cream/40" />
                          ) : (
                            teacherSlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="rounded-lg bg-cream border border-sand/60 px-2 py-1.5 text-xs"
                              >
                                <p className="font-medium text-espresso truncate">
                                  {getSubject(slot.subject_id)?.name ?? '—'}
                                </p>
                                <p className="text-taupe truncate">
                                  {sections.find((s) => s.id === slot.section_id)?.name} · P{slot.slot_number}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Timetable grid — By Room */}
      {view === 'room' && (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th className="w-32 text-xs text-taupe font-medium text-left pb-2">Room</th>
                {DAYS.map((day) => (
                  <th key={day} className="text-xs text-taupe font-medium text-center pb-2">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="align-top pr-2">
                    <p className="text-xs font-medium text-espresso">{room.name}</p>
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const day = dayIdx + 1
                    const roomSlots = slots.filter(
                      (s) => s.room_id === room.id && s.day_of_week === day
                    )
                    return (
                      <td key={day} className="align-top">
                        <div className="space-y-1">
                          {roomSlots.length === 0 ? (
                            <div className="h-10 rounded-lg bg-cream/40" />
                          ) : (
                            roomSlots.map((slot) => (
                              <div
                                key={slot.id}
                                className="rounded-lg bg-cream border border-sand/60 px-2 py-1.5 text-xs"
                              >
                                <p className="font-medium text-espresso truncate">
                                  {getSubject(slot.subject_id)?.name ?? '—'}
                                </p>
                                <p className="text-taupe truncate">
                                  {sections.find((s) => s.id === slot.section_id)?.name} · P{slot.slot_number}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit slot panel */}
      <SlidePanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editSlot?.id ? 'Edit period' : 'Assign period'}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Subject"
            value={editSubjectId}
            onChange={(e) => setEditSubjectId(e.target.value)}
          >
            <option value="">— None —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Select
            label="Teacher"
            value={editTeacherId}
            onChange={(e) => setEditTeacherId(e.target.value)}
          >
            <option value="">— None —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Select
            label="Room"
            value={editRoomId}
            onChange={(e) => setEditRoomId(e.target.value)}
          >
            <option value="">— None —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </div>
      </SlidePanel>
    </div>
  )
}
