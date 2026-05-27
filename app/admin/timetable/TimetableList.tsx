'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Sparkles, Eye, Trash2, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Timetable, Term } from '@/types'

interface TimetableListProps {
  timetables: (Timetable & { terms: { name: string } | null })[]
  terms: Term[]
  schoolId: string
}

export function TimetableList({ timetables, terms, schoolId }: TimetableListProps) {
  const [generating, setGenerating] = useState(false)
  const [conflicts, setConflicts] = useState<{ message: string; severity: string }[] | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  // Use the first (most recent) active term automatically
  const activeTerm = terms.find((t) => t.is_active) ?? terms[0]

  async function handleGenerate() {
    if (!activeTerm) {
      toast({ variant: 'error', title: 'No term configured. Go to Settings to create a term first.' })
      return
    }
    setGenerating(true)
    setConflicts(null)

    const { data: timetable, error } = await supabase
      .from('timetables')
      .insert({
        school_id: schoolId,
        term_id: activeTerm.id,
        label: `Timetable — ${format(new Date(), 'MMM yyyy')}`,
      })
      .select()
      .single()

    if (error || !timetable) {
      toast({ variant: 'error', title: 'Failed to create timetable record' })
      setGenerating(false)
      return
    }

    const res = await fetch('/api/generate-timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timetableId: timetable.id, schoolId, termId: activeTerm.id }),
    })

    const data = await res.json()

    if (res.status === 422) {
      setConflicts(data.conflicts)
      await supabase.from('timetables').delete().eq('id', timetable.id)
    } else if (data.status === 'success') {
      toast({ variant: 'success', title: `Generated ${data.generated} assignments` })
      router.refresh()
    } else {
      toast({ variant: 'error', title: data.error ?? 'Generation failed' })
    }

    setGenerating(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('timetables').delete().eq('id', deleteId)
    setDeleteId(null)
    router.refresh()
  }

  async function handlePublish(id: string, currentState: boolean) {
    await supabase
      .from('timetables')
      .update({ is_published: !currentState, published_at: !currentState ? new Date().toISOString() : null })
      .eq('id', id)
    router.refresh()
  }

  const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' }
  const serif: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' }

  return (
    <div className="space-y-8">

      {/* ── Header row ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1" style={{ ...serif, color: 'var(--color-brand-mocha)' }}>
            Timetables
          </h1>
          {activeTerm ? (
            <p className="text-xs uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
              Active term: {activeTerm.name}
            </p>
          ) : (
            <p className="text-xs uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-error)' }}>
              No active term — configure one in Settings
            </p>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !activeTerm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-bold transition-opacity disabled:opacity-40"
          style={{
            ...mono,
            backgroundColor: 'var(--color-brand-mocha)',
            color: 'var(--color-brand-linen)',
          }}
        >
          <Sparkles className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating…' : 'Generate New'}
        </button>
      </div>

      {/* ── Conflict report ─────────────────────────────── */}
      {conflicts && (
        <div
          className="px-5 py-4 rounded-xl"
          style={{
            backgroundColor: 'rgba(182,109,109,0.06)',
            border: '0.5px solid rgba(182,109,109,0.3)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" style={{ color: 'var(--color-brand-error)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-brand-error)', ...mono }}>
              Conflicts detected — resolve these before generating
            </p>
          </div>
          <ul className="space-y-1">
            {conflicts.map((c, i) => (
              <li key={i} className="text-sm" style={{ color: 'var(--color-brand-error)', ...mono, opacity: 0.85 }}>
                · {c.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Timetable list ──────────────────────────────── */}
      {timetables.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
        >
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 opacity-30"
            style={{ backgroundColor: 'var(--color-brand-mocha)' }}
          >
            <Sparkles className="h-5 w-5" style={{ color: 'var(--color-brand-linen)' }} />
          </div>
          <p className="text-sm" style={{ ...mono, color: 'var(--color-brand-taupe)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            No timetables yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-brand-clay)' }}>
            Click Generate New to create your first timetable
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {timetables.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-5 py-4 rounded-xl transition-all"
              style={{
                backgroundColor: 'var(--color-brand-cream)',
                border: '0.5px solid var(--color-brand-sand)',
              }}
            >
              {/* Left info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-brand-mocha)' }}>
                    {t.label}
                  </span>
                  {t.is_published ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest"
                      style={{
                        ...mono,
                        backgroundColor: 'rgba(107,123,92,0.12)',
                        color: 'var(--color-brand-success)',
                      }}
                    >
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Published
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest"
                      style={{
                        ...mono,
                        backgroundColor: 'rgba(60,53,48,0.07)',
                        color: 'var(--color-brand-taupe)',
                      }}
                    >
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                  {(t.terms as unknown as { name: string })?.name ?? 'No term'}
                  {t.generated_at && ` · ${format(new Date(t.generated_at), 'MMM d, yyyy')}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => router.push(`/admin/timetable/${t.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                  style={{
                    ...mono,
                    backgroundColor: 'var(--color-brand-champagne)',
                    color: 'var(--color-brand-mocha)',
                    border: '0.5px solid var(--color-brand-sand)',
                  }}
                >
                  <Eye className="h-3 w-3" />
                  View
                </button>
                <button
                  onClick={() => handlePublish(t.id, t.is_published)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-opacity hover:opacity-70"
                  style={{
                    ...mono,
                    backgroundColor: t.is_published ? 'rgba(60,53,48,0.07)' : 'rgba(107,123,92,0.12)',
                    color: t.is_published ? 'var(--color-brand-taupe)' : 'var(--color-brand-success)',
                    border: '0.5px solid var(--color-brand-sand)',
                  }}
                >
                  {t.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => setDeleteId(t.id)}
                  className="p-1.5 rounded-full transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-brand-taupe)' }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete timetable"
        description="This will permanently delete the timetable and all its assignments. This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
