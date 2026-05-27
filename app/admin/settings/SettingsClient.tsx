'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, CheckCircle2, Circle, RefreshCw, Check, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Term, TimetableSnapshot } from '@/types'

interface SettingsTeacher {
  id: string
  name: string
  username: string | null
  email: string | null
  is_active: boolean
  user_id: string | null
}

interface SettingsClientProps {
  school: { id: string; name: string; logo_url: string | null } | null
  terms: Term[]
  snapshots: (TimetableSnapshot & { timetables: { label: string } | null })[]
  teachers: SettingsTeacher[]
}

const mono:  React.CSSProperties = { fontFamily: 'var(--font-mono)' }
const serif: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '0.5px solid var(--color-brand-sand)' }}
    >
      <div
        className="px-6 py-4 border-b"
        style={{ backgroundColor: 'var(--color-brand-cream)', borderColor: 'var(--color-brand-sand)' }}
      >
        <p className="text-[11px] uppercase tracking-widest font-bold" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>
          {title}
        </p>
      </div>
      <div className="px-6 py-5" style={{ backgroundColor: 'var(--color-brand-linen)' }}>
        {children}
      </div>
    </div>
  )
}

function FieldInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-mocha)' }}
      />
    </div>
  )
}

export function SettingsClient({ school, terms, snapshots, teachers }: SettingsClientProps) {
  const [schoolName, setSchoolName] = useState(school?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [newTermName, setNewTermName] = useState('')
  const [newTermStart, setNewTermStart] = useState('')
  const [newTermEnd, setNewTermEnd] = useState('')
  const [addingTerm, setAddingTerm] = useState(false)
  const [showAddTerm, setShowAddTerm] = useState(false)

  // Reset PIN state
  const [resettingPinFor, setResettingPinFor] = useState<string | null>(null)
  const [resetPinResult, setResetPinResult] = useState<{ teacherId: string; name: string; pin: string } | null>(null)
  const [pinCopied, setPinCopied] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  async function saveSchoolName() {
    if (!school?.id) return
    setSaving(true)
    const { error } = await supabase.from('schools').update({ name: schoolName }).eq('id', school.id)
    if (error) {
      toast({ variant: 'error', title: 'Failed to save' })
    } else {
      toast({ variant: 'success', title: 'School name updated' })
      router.refresh()
    }
    setSaving(false)
  }

  async function addTerm() {
    if (!school?.id || !newTermName || !newTermStart || !newTermEnd) return
    setAddingTerm(true)

    const isFirst = terms.length === 0
    const { error } = await supabase.from('terms').insert({
      school_id: school.id,
      name: newTermName,
      start_date: newTermStart,
      end_date: newTermEnd,
      is_active: isFirst,
    })

    if (error) {
      toast({ variant: 'error', title: 'Failed to add term' })
    } else {
      toast({ variant: 'success', title: `Term "${newTermName}" created` })
      setNewTermName('')
      setNewTermStart('')
      setNewTermEnd('')
      setShowAddTerm(false)
      router.refresh()
    }
    setAddingTerm(false)
  }

  async function setActiveTerm(termId: string) {
    if (!school?.id) return
    await supabase.from('terms').update({ is_active: false }).eq('school_id', school.id)
    await supabase.from('terms').update({ is_active: true }).eq('id', termId)
    toast({ variant: 'success', title: 'Active term updated' })
    router.refresh()
  }

  async function deleteTerm(termId: string) {
    await supabase.from('terms').delete().eq('id', termId)
    toast({ variant: 'success', title: 'Term deleted' })
    router.refresh()
  }

  async function handleResetPin(teacher: SettingsTeacher) {
    setResettingPinFor(teacher.id)

    const res = await fetch('/api/admin/reset-teacher-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherId: teacher.id }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast({ variant: 'error', title: data.error ?? 'Failed to reset PIN' })
    } else {
      setResetPinResult({ teacherId: teacher.id, name: teacher.name, pin: data.pin })
    }
    setResettingPinFor(null)
  }

  function copyPin() {
    if (!resetPinResult) return
    navigator.clipboard.writeText(
      `Username: ${teachers.find(t => t.id === resetPinResult.teacherId)?.username ?? resetPinResult.name}\nNew PIN: ${resetPinResult.pin}`
    )
    setPinCopied(true)
    setTimeout(() => setPinCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-1" style={{ ...serif, color: 'var(--color-brand-mocha)' }}>
          Settings
        </h1>
        <p className="text-xs uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
          School configuration
        </p>
      </div>

      <div className="space-y-5">
        {/* ── School Profile ────────────────────────────── */}
        <Section title="School Profile">
          <div className="space-y-4">
            <FieldInput
              label="School Name"
              value={schoolName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchoolName(e.target.value)}
              placeholder="Your school's name"
            />
            <button
              onClick={saveSchoolName}
              disabled={saving}
              className="px-5 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75 disabled:opacity-40"
              style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Section>

        {/* ── Academic Terms ───────────────────────── */}
        <Section title="Academic Terms">
          <div className="space-y-2 mb-4">
            {terms.length === 0 && !showAddTerm && (
              <p className="text-sm" style={{ ...mono, color: 'var(--color-brand-taupe)', opacity: 0.7 }}>
                No terms yet. Add your first term below.
              </p>
            )}
            {terms.map((term) => (
              <div
                key={term.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => !term.is_active && setActiveTerm(term.id)}
                    className="flex-shrink-0 transition-opacity hover:opacity-70"
                    style={{ color: term.is_active ? 'var(--color-brand-success)' : 'var(--color-brand-sand)' }}
                  >
                    {term.is_active
                      ? <CheckCircle2 className="h-4 w-4" />
                      : <Circle className="h-4 w-4" />
                    }
                  </button>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-brand-mocha)' }}>{term.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                      {term.start_date
                        ? `${format(new Date(term.start_date), 'MMM d')} – ${format(new Date(term.end_date), 'MMM d, yyyy')}`
                        : 'No dates set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {term.is_active && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest"
                      style={{ ...mono, backgroundColor: 'rgba(107,123,92,0.12)', color: 'var(--color-brand-success)' }}
                    >
                      Active
                    </span>
                  )}
                  <button
                    onClick={() => deleteTerm(term.id)}
                    className="text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                    style={{ ...mono, color: 'var(--color-brand-taupe)' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAddTerm ? (
            <div
              className="rounded-xl p-4 space-y-4"
              style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
            >
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>
                New Term
              </p>
              <FieldInput
                label="Term Name"
                value={newTermName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTermName(e.target.value)}
                placeholder="e.g. Term 1, Q1, Spring"
              />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput
                  label="Start Date"
                  type="date"
                  value={newTermStart}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTermStart(e.target.value)}
                />
                <FieldInput
                  label="End Date"
                  type="date"
                  value={newTermEnd}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTermEnd(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddTerm(false)}
                  className="flex-1 py-2 rounded-full text-[11px] uppercase tracking-widest transition-opacity hover:opacity-70"
                  style={{ ...mono, border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-taupe)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={addTerm}
                  disabled={addingTerm || !newTermName || !newTermStart || !newTermEnd}
                  className="flex-1 py-2 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity hover:opacity-75 disabled:opacity-40"
                  style={{ ...mono, backgroundColor: 'var(--color-brand-mocha)', color: 'var(--color-brand-linen)' }}
                >
                  {addingTerm ? 'Adding…' : 'Add Term'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddTerm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
              style={{ ...mono, border: '0.5px dashed var(--color-brand-sand)', color: 'var(--color-brand-taupe)' }}
            >
              <Plus className="h-3 w-3" />
              Add Term
            </button>
          )}
        </Section>

        {/* ── Access & Accounts ──────────────────────── */}
        <Section title="Access & Accounts">
          {/* Reset PIN result banner */}
          {resetPinResult && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
              style={{ backgroundColor: 'rgba(107,123,92,0.08)', border: '0.5px solid rgba(107,123,92,0.2)' }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--color-brand-success)' }}>
                  PIN reset for {resetPinResult.name}
                </p>
                <p className="text-sm font-bold tracking-[0.2em] mt-0.5" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>
                  {resetPinResult.pin}
                </p>
              </div>
              <button
                onClick={copyPin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                style={{ ...mono, border: '0.5px solid rgba(107,123,92,0.3)', color: 'var(--color-brand-success)' }}
              >
                {pinCopied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
              </button>
            </div>
          )}

          {teachers.length === 0 ? (
            <p className="text-sm" style={{ ...mono, color: 'var(--color-brand-taupe)', opacity: 0.7 }}>
              No teachers registered yet.
            </p>
          ) : (
            <div className="space-y-2">
              {teachers.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: t.is_active ? 'var(--color-brand-mocha)' : 'var(--color-brand-sand)', color: 'var(--color-brand-linen)' }}
                    >
                      {t.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-brand-mocha)' }}>{t.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                        {t.username ? `@${t.username}` : 'no username'}
                        {!t.user_id && ' · no login account'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest"
                      style={{
                        ...mono,
                        backgroundColor: t.is_active ? 'rgba(107,123,92,0.12)' : 'rgba(60,53,48,0.07)',
                        color: t.is_active ? 'var(--color-brand-success)' : 'var(--color-brand-taupe)',
                      }}
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {t.user_id && (
                      <button
                        onClick={() => handleResetPin(t)}
                        disabled={resettingPinFor === t.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70 disabled:opacity-40"
                        style={{ ...mono, border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-taupe)' }}
                      >
                        <RefreshCw className={`h-3 w-3 ${resettingPinFor === t.id ? 'animate-spin' : ''}`} />
                        {resettingPinFor === t.id ? 'Resetting…' : 'Reset PIN'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] mt-3" style={{ ...mono, color: 'var(--color-brand-taupe)', opacity: 0.6 }}>
            Teachers log in at /login using their username and PIN. Reset PIN generates a new 6-digit password.
          </p>
        </Section>

        {/* ── Timetable Snapshots ──────────────────────── */}
        <Section title="Timetable Snapshots">
          {snapshots.length === 0 ? (
            <p className="text-sm" style={{ ...mono, color: 'var(--color-brand-taupe)', opacity: 0.7 }}>
              No snapshots yet. Snapshots are created automatically when a timetable is generated.
            </p>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
                >
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-brand-mocha)' }}>
                      {snap.label ?? 'Snapshot'}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                      {snap.timetables?.label}
                      {snap.created_at ? ` · ${format(new Date(snap.created_at), 'MMM d, HH:mm')}` : ''}
                    </p>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                    style={{ ...mono, border: '0.5px solid var(--color-brand-sand)', color: 'var(--color-brand-taupe)' }}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
