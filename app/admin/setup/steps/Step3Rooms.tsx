'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useWizardStore } from '@/lib/store/wizard-store'
import { createClient } from '@/lib/supabase/client'

const ROOM_TYPES = ['classroom', 'lab', 'sports', 'library', 'auditorium', 'other']

export function Step3Rooms() {
  const { rooms, setRooms, schoolId, setStep } = useWizardStore()
  const [localRooms, setLocalRooms] = useState(rooms)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  function addRoom() {
    setLocalRooms((r) => [
      ...r,
      { name: '', type: 'classroom', maxSimultaneousUse: 1 },
    ])
  }

  function updateRoom(idx: number, field: string, value: string | number) {
    setLocalRooms((r) => r.map((room, i) => (i === idx ? { ...room, [field]: value } : room)))
  }

  function removeRoom(idx: number) {
    setLocalRooms((r) => r.filter((_, i) => i !== idx))
  }

  async function handleNext() {
    const filtered = localRooms.filter((r) => r.name.trim())
    setRooms(filtered)

    if (!schoolId) {
      setStep(4)
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Replace existing rooms with current list
      await supabase.from('rooms').delete().eq('school_id', schoolId)

      if (filtered.length > 0) {
        await supabase.from('rooms').insert(
          filtered.map((r) => ({
            school_id: schoolId,
            name: r.name,
            type: r.type as 'classroom' | 'lab' | 'sports' | 'library' | 'auditorium' | 'other',
            max_simultaneous_use: r.maxSimultaneousUse,
          }))
        )
      }
    } catch {
      setError('Failed to save rooms. Please try again.')
      setSaving(false)
      return
    }

    setSaving(false)
    setStep(4)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cormorant text-3xl font-semibold text-espresso mb-2">Rooms & Facilities</h2>
        <p className="text-taupe">Add all rooms and facilities available for scheduling. You can skip this and add rooms later.</p>
      </div>

      <div className="space-y-3">
        {localRooms.map((room, i) => (
          <div key={i} className="flex gap-3 items-end bg-cream/50 rounded-xl p-4">
            <Input
              label="Room name"
              value={room.name}
              onChange={(e) => updateRoom(i, 'name', e.target.value)}
              placeholder="e.g. Room 101"
              className="flex-1"
            />
            <Select
              label="Type"
              value={room.type}
              onChange={(e) => updateRoom(i, 'type', e.target.value)}
              className="w-36"
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Input
              label="Max simultaneous"
              type="number"
              value={room.maxSimultaneousUse}
              onChange={(e) => updateRoom(i, 'maxSimultaneousUse', Number(e.target.value))}
              className="w-24"
              min={1}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeRoom(i)}
              className="mb-0.5 text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button variant="secondary" onClick={addRoom} className="w-full">
          <Plus className="h-4 w-4" /> Add room
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
        <Button onClick={handleNext} loading={saving}>Continue</Button>
      </div>
    </div>
  )
}
