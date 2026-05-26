'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Select } from '@/components/ui/Select'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Timetable, Term } from '@/types'

interface TimetableListProps {
  timetables: (Timetable & { terms: { name: string } | null })[]
  terms: Term[]
  schoolId: string
}

export function TimetableList({ timetables, terms, schoolId }: TimetableListProps) {
  const [selectedTermId, setSelectedTermId] = useState(terms[0]?.id ?? '')
  const [generating, setGenerating] = useState(false)
  const [conflicts, setConflicts] = useState<{ message: string; severity: string }[] | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  async function handleGenerate() {
    if (!selectedTermId) return
    setGenerating(true)
    setConflicts(null)

    // Create a new timetable record
    const { data: timetable, error } = await supabase
      .from('timetables')
      .insert({
        school_id: schoolId,
        term_id: selectedTermId,
        label: `Timetable — ${format(new Date(), 'MMM yyyy')}`,
      })
      .select()
      .single()

    if (error || !timetable) {
      toast({ variant: 'error', title: 'Failed to create timetable' })
      setGenerating(false)
      return
    }

    const res = await fetch('/api/generate-timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timetableId: timetable.id, schoolId, termId: selectedTermId }),
    })

    const data = await res.json()

    if (res.status === 422) {
      setConflicts(data.conflicts)
      // Clean up the timetable record
      await supabase.from('timetables').delete().eq('id', timetable.id)
    } else if (data.status === 'success') {
      toast({ variant: 'success', title: `Generated ${data.generated} slots` })
      router.refresh()
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

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-3">
        <Select
          label="Term"
          value={selectedTermId}
          onChange={(e) => setSelectedTermId(e.target.value)}
          className="w-48"
        >
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
        <Button onClick={handleGenerate} loading={generating}>
          <Calendar className="h-4 w-4" /> Generate new timetable
        </Button>
      </div>

      {conflicts && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm font-medium text-red-700">Conflicts found — fix these before generating</p>
          </div>
          <ul className="space-y-1">
            {conflicts.map((c, i) => (
              <li key={i} className="text-sm text-red-600">• {c.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4">
        {timetables.length === 0 ? (
          <div className="text-center py-16 text-taupe">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No timetables yet. Generate your first one.</p>
          </div>
        ) : (
          timetables.map((t) => (
            <Card
              key={t.id}
              title={t.label}
              subtitle={(t.terms as unknown as { name: string })?.name ?? ''}
              action={
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => router.push(`/admin/timetable/${t.id}`)}>
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant={t.is_published ? 'secondary' : 'primary'}
                    onClick={() => handlePublish(t.id, t.is_published)}
                  >
                    {t.is_published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteId(t.id)}>
                    Delete
                  </Button>
                </div>
              }
            >
              <div className="flex items-center gap-3">
                <Badge variant={t.is_published ? 'success' : 'default'}>
                  {t.is_published ? 'Published' : 'Draft'}
                </Badge>
                {t.generated_at && (
                  <span className="text-xs text-taupe">
                    Generated {format(new Date(t.generated_at), 'MMM d, yyyy')}
                  </span>
                )}
                {t.is_published && t.published_at && (
                  <span className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Published {format(new Date(t.published_at), 'MMM d')}
                  </span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete timetable"
        description="This will permanently delete the timetable and all its slots. This action cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}
