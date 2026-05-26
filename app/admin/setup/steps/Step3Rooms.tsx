'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useWizardStore } from '@/lib/store/wizard-store'

const ROOM_TYPES = ['classroom', 'lab', 'sports', 'library', 'auditorium', 'other']

export function Step3Rooms() {
  const { rooms, setRooms, setStep } = useWizardStore()
  const [localRooms, setLocalRooms] = useState(rooms)

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

  function handleNext() {
    setRooms(localRooms.filter((r) => r.name.trim()))
    setStep(4)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cormorant text-3xl font-semibold text-espresso mb-2">Rooms & Facilities</h2>
        <p className="text-taupe">Add all rooms and facilities available for scheduling.</p>
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

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  )
}
