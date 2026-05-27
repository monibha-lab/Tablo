'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, UserX, Copy, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Teacher, Subject, Grade } from '@/types'

/* ─── types ─────────────────────────────────────────────── */

type TeacherWithSubjects = Teacher & {
  teacher_subjects: { subject_id: string; grade_id: string }[]
  username?: string | null
}

interface TeachersClientProps {
  teachers: TeacherWithSubjects[]
  subjects: Subject[]
  grades: Grade[]
  schoolId: string
}

/* ─── helpers ───────────────────────────────────────────── */

function generateUsername(name: string, existing: string[]): string {
  const parts = name.toLowerCase().trim().split(/\s+/)
  const base =
    parts.length >= 2
      ? `${parts[0]}.${parts[parts.length - 1]}`
      : parts[0] || 'teacher'
  const slug = base.replace(/[^a-z0-9.]/g, '')
  let candidate = slug
  let i = 2
  while (existing.includes(candidate)) {
    candidate = `${slug}${i}`
    i++
  }
  return candidate
}

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' }
const serif: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' }

/* ─── component ─────────────────────────────────────────── */

export function TeachersClient({ teachers, subjects, grades, schoolId }: TeachersClientProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState<TeacherWithSubjects | null>(null)
  const [deactivateId, setDeactivateId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [maxPeriods, setMaxPeriods] = useState(6)
  const [saving, setSaving] = useState(false)

  // Credential display after creation
  const [newCreds, setNewCreds] = useState<{ username: string; pin: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  function openAdd() {
    setEditing(null)
    setName('')
    setEmail('')
    setMaxPeriods(6)
    setNewCreds(null)
    setPanelOpen(true)
  }

  function openEdit(t: TeacherWithSubjects) {
    setEditing(t)
    setName(t.name)
    setEmail(t.email ?? '')
    setMaxPeriods(t.max_periods_per_day)
    setNewCreds(null)
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelOpen(false)
    setNewCreds(null)
    if (newCreds) router.refresh()
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    if (editing) {
      await supabase
        .from('teachers')
        .update({ name, email: email || null, max_periods_per_day: maxPeriods })
        .eq('id', editing.id)
      toast({ variant: 'success', title: 'Teacher updated' })
      setSaving(false)
      setPanelOpen(false)
      router.refresh()
    } else {
      // Generate username + PIN
      const existingUsernames = teachers.map((t) => t.username ?? '').filter(Boolean)
      const username = generateUsername(name, existingUsernames)
      const pin = generatePin()

      // Construct internal email
      const internalEmail = email.trim() || `${username}@school.tablo.internal`

      // Create auth user with PIN as password via admin action
      const res = await fetch('/api/admin/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email: internalEmail, pin, schoolId, maxPeriods }),
      })

      if (!res.ok) {
        const d = await res.json()
        toast({ variant: 'error', title: d.error ?? 'Failed to create teacher' })
        setSaving(false)
        return
      }

      setNewCreds({ username, pin })
      toast({ variant: 'success', title: 'Teacher created' })
    }

    setSaving(false)
  }

  async function handleDeactivate() {
    if (!deactivateId) return
    await supabase.from('teachers').update({ is_active: false }).eq('id', deactivateId)
    setDeactivateId(null)
    toast({ variant: 'success', title: 'Teacher deactivated' })
    router.refresh()
  }

  function copyCredentials() {
    if (!newCreds) return
    navigator.clipboard.writeText(`Username: ${newCreds.username}\nTemporary PIN: ${newCreds.pin}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={{ ...serif, color: 'var(--color-brand-mocha)' }}>
            Faculty
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
            {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75"
          style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Teacher
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '0.5px solid var(--color-brand-sand)' }}
      >
        {teachers.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--color-brand-taupe)', ...mono, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            No teachers yet
          </div>
        ) : (
          <table className="w-full">
            <thead
              className="border-b"
              style={{ borderColor: 'var(--color-brand-sand)', backgroundColor: 'var(--color-brand-cream)' }}
            >
              <tr>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Name</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest hidden sm:table-cell" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Username</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest hidden md:table-cell" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Subjects</th>
                <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <>
                  <tr
                    key={t.id}
                    className="border-b last:border-0 transition-colors cursor-pointer"
                    style={{
                      borderColor: 'rgba(230,226,221,0.5)',
                      backgroundColor: expandedId === t.id ? 'var(--color-brand-champagne)' : 'transparent',
                    }}
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
                        >
                          {t.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-brand-mocha)' }}>{t.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-xs" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                        {t.username ?? <span style={{ opacity: 0.4 }}>—</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                        {t.teacher_subjects?.length ?? 0} subject{(t.teacher_subjects?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest"
                        style={{
                          ...mono,
                          backgroundColor: t.is_active ? 'rgba(107,123,92,0.12)' : 'rgba(60,53,48,0.07)',
                          color: t.is_active ? 'var(--color-brand-success)' : 'var(--color-brand-taupe)',
                        }}
                      >
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-1.5 rounded-full transition-opacity hover:opacity-70"
                          style={{ color: 'var(--color-brand-taupe)' }}
                          onClick={() => openEdit(t)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {t.is_active && (
                          <button
                            className="p-1.5 rounded-full transition-opacity hover:opacity-70"
                            style={{ color: 'var(--color-brand-taupe)' }}
                            onClick={() => setDeactivateId(t.id)}
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <span style={{ color: 'var(--color-brand-sand)' }}>
                          {expandedId === t.id
                            ? <ChevronUp className="h-3.5 w-3.5" />
                            : <ChevronDown className="h-3.5 w-3.5" />
                          }
                        </span>
                      </div>
                    </td>
                  </tr>
                  {expandedId === t.id && (
                    <tr key={`${t.id}-expand`} style={{ backgroundColor: 'var(--color-brand-champagne)' }}>
                      <td colSpan={5} className="px-5 pb-4 pt-1">
                        <p className="text-[10px] uppercase tracking-widest mb-2" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                          Assigned Subjects
                        </p>
                        {(t.teacher_subjects?.length ?? 0) === 0 ? (
                          <p className="text-xs" style={{ ...mono, color: 'var(--color-brand-clay)' }}>No subjects assigned yet</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {t.teacher_subjects.map((ts, i) => {
                              const sub = subjects.find((s) => s.id === ts.subject_id)
                              return (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-full text-xs"
                                  style={{
                                    ...mono,
                                    backgroundColor: 'rgba(60,53,48,0.07)',
                                    color: 'var(--color-brand-mocha)',
                                  }}
                                >
                                  {sub?.name ?? ts.subject_id}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add/Edit Panel ─────────────────────────────── */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={closePanel} />
          <div
            className="fixed right-0 top-0 h-full z-50 w-full max-w-sm flex flex-col"
            style={{ backgroundColor: 'var(--color-brand-linen)', borderLeft: '0.5px solid var(--color-brand-sand)' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--color-brand-sand)' }}>
              <span className="text-sm font-medium" style={{ ...mono, color: 'var(--color-brand-mocha)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {editing ? 'Edit Teacher' : 'Add Teacher'}
              </span>
              <button onClick={closePanel} className="p-1 rounded-full transition-opacity hover:opacity-70" style={{ color: 'var(--color-brand-taupe)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Credentials display (shown after creation) */}
            {newCreds ? (
              <div className="flex-1 flex flex-col px-6 py-8 gap-6">
                <div>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(107,123,92,0.12)' }}>
                    <Check className="h-5 w-5" style={{ color: 'var(--color-brand-success)' }} />
                  </div>
                  <h2 className="text-xl mb-1" style={{ ...serif, color: 'var(--color-brand-mocha)' }}>Teacher Created</h2>
                  <p className="text-xs" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                    Share these credentials with the teacher. The PIN is their temporary password.
                  </p>
                </div>

                <div
                  className="rounded-xl p-5 space-y-3"
                  style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Username</p>
                    <p className="text-sm font-bold" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>{newCreds.username}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-1" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>Temporary PIN</p>
                    <p className="text-2xl font-bold tracking-[0.3em]" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>{newCreds.pin}</p>
                  </div>
                </div>

                <button
                  onClick={copyCredentials}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75"
                  style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
                >
                  {copied ? <><Check className="h-3.5 w-3.5" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy Credentials</>}
                </button>
                <button
                  onClick={closePanel}
                  className="text-xs uppercase tracking-widest text-center transition-opacity hover:opacity-70"
                  style={{ ...mono, color: 'var(--color-brand-taupe)' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Form */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                      Full Name *
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Johnson"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--color-brand-cream)',
                        border: '0.5px solid var(--color-brand-sand)',
                        color: 'var(--color-brand-mocha)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                      Email (optional)
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="teacher@school.edu"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--color-brand-cream)',
                        border: '0.5px solid var(--color-brand-sand)',
                        color: 'var(--color-brand-mocha)',
                      }}
                    />
                    {!editing && name && (
                      <p className="text-[10px] mt-1.5" style={{ ...mono, color: 'var(--color-brand-clay)' }}>
                        Username will be auto-generated from name
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                      Max Periods per Day
                    </label>
                    <input
                      type="number"
                      value={maxPeriods}
                      onChange={(e) => setMaxPeriods(Number(e.target.value))}
                      min={1}
                      max={12}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        backgroundColor: 'var(--color-brand-cream)',
                        border: '0.5px solid var(--color-brand-sand)',
                        color: 'var(--color-brand-mocha)',
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t flex gap-2" style={{ borderColor: 'var(--color-brand-sand)' }}>
                  <button
                    onClick={closePanel}
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
                    {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Teacher'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

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
