'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, DoorOpen, FlaskConical, Dumbbell, BookOpen, Mic, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Room } from '@/types'

const ROOM_TYPES = ['classroom', 'lab', 'sports', 'library', 'auditorium', 'other'] as const
type RoomType = (typeof ROOM_TYPES)[number]

const typeIcons: Record<RoomType, React.ReactNode> = {
  classroom: <DoorOpen className="h-5 w-5" />,
  lab: <FlaskConical className="h-5 w-5" />,
  sports: <Dumbbell className="h-5 w-5" />,
  library: <BookOpen className="h-5 w-5" />,
  auditorium: <Mic className="h-5 w-5" />,
  other: <HelpCircle className="h-5 w-5" />,
}

interface RoomsClientProps {
  rooms: Room[]
  schoolId: string
}

export function RoomsClient({ rooms, schoolId }: RoomsClientProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<RoomType>('classroom')
  const [maxUse, setMaxUse] = useState(1)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const grouped = ROOM_TYPES.reduce<Record<string, Room[]>>((acc, t) => {
    acc[t] = rooms.filter((r) => r.type === t)
    return acc
  }, {} as Record<string, Room[]>)

  function openAdd() {
    setEditing(null); setName(''); setType('classroom'); setMaxUse(1); setPanelOpen(true)
  }

  function openEdit(r: Room) {
    setEditing(r); setName(r.name); setType(r.type as RoomType); setMaxUse(r.max_simultaneous_use); setPanelOpen(true)
  }

  async function handleSave() {
    if (!name) return
    setSaving(true)
    if (editing) {
      await supabase.from('rooms').update({ name, type, max_simultaneous_use: maxUse }).eq('id', editing.id)
      toast({ variant: 'success', title: 'Room updated' })
    } else {
      await supabase.from('rooms').insert({ school_id: schoolId, name, type, max_simultaneous_use: maxUse })
      toast({ variant: 'success', title: 'Room added' })
    }
    setSaving(false); setPanelOpen(false); router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('rooms').delete().eq('id', deleteId)
    setDeleteId(null); toast({ variant: 'success', title: 'Room deleted' }); router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Rooms</h1>
          <p className="text-taupe">{rooms.length} room{rooms.length !== 1 ? 's' : ''} configured</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" /> Add room</Button>
      </div>

      <div className="space-y-8">
        {ROOM_TYPES.filter((t) => grouped[t].length > 0).map((roomType) => (
          <div key={roomType}>
            <h3 className="flex items-center gap-2 text-sm font-medium text-taupe capitalize mb-3">
              {typeIcons[roomType]} {roomType}s
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {grouped[roomType].map((room) => (
                <div key={room.id} className="bg-ivory border border-sand/60 rounded-2xl p-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-espresso">{room.name}</p>
                    {room.max_simultaneous_use > 1 && (
                      <Badge size="sm" className="mt-1">Max {room.max_simultaneous_use} classes</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(room)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(room.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-clay" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {rooms.length === 0 && (
          <div className="text-center py-16 text-taupe">No rooms yet. Add your first room.</div>
        )}
      </div>

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editing ? 'Edit room' : 'Add room'}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Save' : 'Add room'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Room name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value as RoomType)}>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input
            label="Max simultaneous classes"
            type="number"
            value={maxUse}
            onChange={(e) => setMaxUse(Number(e.target.value))}
            min={1}
            helper="Set to 1 for exclusive use, higher for shared spaces"
          />
        </div>
      </SlidePanel>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete room"
        description="This room will be removed from all future scheduling. Existing timetable slots won't be affected."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
