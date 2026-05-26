'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit2, UserX } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { Select } from '@/components/ui/Select'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Teacher, Subject, Grade } from '@/types'

type TeacherWithSubjects = Teacher & {
  teacher_subjects: { subject_id: string; grade_id: string }[]
}

interface TeachersClientProps {
  teachers: TeacherWithSubjects[]
  subjects: Subject[]
  grades: Grade[]
  schoolId: string
}

export function TeachersClient({ teachers, subjects, grades, schoolId }: TeachersClientProps) {
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherWithSubjects | null>(null)
  const [deactivateId, setDeactivateId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [maxPeriods, setMaxPeriods] = useState(6)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const filtered = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setEditing(null)
    setName('')
    setEmail('')
    setMaxPeriods(6)
    setPanelOpen(true)
  }

  function openEdit(t: TeacherWithSubjects) {
    setEditing(t)
    setName(t.name)
    setEmail(t.email)
    setMaxPeriods(t.max_periods_per_day)
    setPanelOpen(true)
  }

  async function handleSave() {
    if (!name || !email) return
    setSaving(true)

    if (editing) {
      await supabase
        .from('teachers')
        .update({ name, email, max_periods_per_day: maxPeriods })
        .eq('id', editing.id)
      toast({ variant: 'success', title: 'Teacher updated' })
    } else {
      await supabase.from('teachers').insert({
        school_id: schoolId,
        name,
        email,
        max_periods_per_day: maxPeriods,
      })
      toast({ variant: 'success', title: 'Teacher added' })
    }

    setSaving(false)
    setPanelOpen(false)
    router.refresh()
  }

  async function handleDeactivate() {
    if (!deactivateId) return
    await supabase.from('teachers').update({ is_active: false }).eq('id', deactivateId)
    setDeactivateId(null)
    toast({ variant: 'success', title: 'Teacher deactivated' })
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Teachers</h1>
          <p className="text-taupe">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''} in your school</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add teacher
        </Button>
      </div>

      <div className="mb-5">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-taupe" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers..."
            className="w-full bg-cream border border-sand/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-espresso placeholder:text-taupe focus:outline-none focus:ring-2 focus:ring-mocha/30"
          />
        </div>
      </div>

      <div className="bg-ivory border border-sand/60 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-taupe">No teachers found.</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-sand/40">
              <tr>
                <th className="text-left text-xs font-medium text-taupe px-6 py-3">Teacher</th>
                <th className="text-left text-xs font-medium text-taupe px-6 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left text-xs font-medium text-taupe px-6 py-3 hidden md:table-cell">Max periods/day</th>
                <th className="text-left text-xs font-medium text-taupe px-6 py-3">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-sand/20 last:border-0 hover:bg-cream/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.name} size="sm" />
                      <span className="text-sm font-medium text-espresso">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-taupe hidden sm:table-cell">{t.email}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <Badge>{t.max_periods_per_day} periods</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={t.is_active ? 'success' : 'default'}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {t.is_active && (
                        <Button variant="ghost" size="sm" onClick={() => setDeactivateId(t.id)}>
                          <UserX className="h-4 w-4 text-clay" />
                        </Button>
                      )}
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
        title={editing ? 'Edit teacher' : 'Add teacher'}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Save changes' : 'Add teacher'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Max periods per day"
            type="number"
            value={maxPeriods}
            onChange={(e) => setMaxPeriods(Number(e.target.value))}
            min={1}
            max={12}
          />
        </div>
      </SlidePanel>

      <ConfirmModal
        open={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={handleDeactivate}
        title="Deactivate teacher"
        description="This teacher will no longer appear in scheduling options. You can reactivate them at any time."
        confirmLabel="Deactivate"
        danger
      />
    </div>
  )
}
