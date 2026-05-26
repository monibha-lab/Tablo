'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Term, TimetableSnapshot } from '@/types'

interface SettingsClientProps {
  school: { id: string; name: string; logo_url: string | null } | null
  terms: Term[]
  snapshots: (TimetableSnapshot & { timetables: { label: string } | null })[]
}

export function SettingsClient({ school, terms, snapshots }: SettingsClientProps) {
  const [schoolName, setSchoolName] = useState(school?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [newTermName, setNewTermName] = useState('')
  const [newTermStart, setNewTermStart] = useState('')
  const [newTermEnd, setNewTermEnd] = useState('')
  const [addingTerm, setAddingTerm] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  async function saveSchoolName() {
    if (!school?.id) return
    setSaving(true)
    await supabase.from('schools').update({ name: schoolName }).eq('id', school.id)
    toast({ variant: 'success', title: 'School name updated' })
    setSaving(false)
    router.refresh()
  }

  async function addTerm() {
    if (!school?.id || !newTermName || !newTermStart || !newTermEnd) return
    setAddingTerm(true)
    await supabase.from('terms').insert({
      school_id: school.id,
      name: newTermName,
      start_date: newTermStart,
      end_date: newTermEnd,
    })
    toast({ variant: 'success', title: 'Term created' })
    setNewTermName('')
    setNewTermStart('')
    setNewTermEnd('')
    setAddingTerm(false)
    router.refresh()
  }

  async function setActiveTerm(termId: string) {
    if (!school?.id) return
    // Deactivate all
    await supabase.from('terms').update({ is_active: false }).eq('school_id', school.id)
    // Activate selected
    await supabase.from('terms').update({ is_active: true }).eq('id', termId)
    toast({ variant: 'success', title: 'Active term updated' })
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Settings</h1>
        <p className="text-taupe">Manage your school configuration.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* School profile */}
        <Card title="School Profile">
          <div className="space-y-4 mt-4">
            <Input
              label="School name"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
            <Button onClick={saveSchoolName} loading={saving} size="sm">
              Save changes
            </Button>
          </div>
        </Card>

        {/* Academic terms */}
        <Card title="Academic Terms">
          <div className="space-y-3 mt-4">
            {terms.map((term) => (
              <div key={term.id} className="flex items-center justify-between p-3 bg-cream/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-espresso">{term.name}</p>
                  <p className="text-xs text-taupe">
                    {format(new Date(term.start_date), 'MMM d')} – {format(new Date(term.end_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {term.is_active && <Badge variant="success">Active</Badge>}
                  {!term.is_active && (
                    <Button size="sm" variant="secondary" onClick={() => setActiveTerm(term.id)}>
                      Set active
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="border-t border-sand pt-4 mt-4">
              <p className="text-sm font-medium text-espresso mb-3">Add new term</p>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Name"
                  value={newTermName}
                  onChange={(e) => setNewTermName(e.target.value)}
                  placeholder="Term 2"
                />
                <Input
                  label="Start date"
                  type="date"
                  value={newTermStart}
                  onChange={(e) => setNewTermStart(e.target.value)}
                />
                <Input
                  label="End date"
                  type="date"
                  value={newTermEnd}
                  onChange={(e) => setNewTermEnd(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={addTerm} loading={addingTerm} className="mt-3">
                Add term
              </Button>
            </div>
          </div>
        </Card>

        {/* Timetable snapshots */}
        <Card title="Timetable Snapshots">
          <div className="space-y-2 mt-4">
            {snapshots.length === 0 ? (
              <p className="text-sm text-taupe">No snapshots yet. Snapshots are created automatically when a timetable is generated.</p>
            ) : (
              snapshots.map((snap) => (
                <div key={snap.id} className="flex items-center justify-between p-3 bg-cream/50 rounded-xl">
                  <div>
                    <p className="text-sm text-espresso">{snap.label ?? 'Snapshot'}</p>
                    <p className="text-xs text-taupe">
                      {snap.timetables?.label} • {snap.created_at ? format(new Date(snap.created_at), 'MMM d, HH:mm') : ''}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary">Restore</Button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
