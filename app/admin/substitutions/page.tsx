import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { format } from 'date-fns'

export default async function SubstitutionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const { data: requests } = await supabase
    .from('substitution_requests')
    .select(`
      *,
      absent_teacher:teachers!absent_teacher_id(name),
      timetable_slots(slot_number, subjects(name), sections(name, grades(name)))
    `)
    .order('created_at', { ascending: false })

  const open   = (requests ?? []).filter((r) => r.status === 'open')
  const filled = (requests ?? []).filter((r) => r.status === 'filled')

  const mono: React.CSSProperties  = { fontFamily: 'var(--font-mono)' }
  const serif: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' }

  function RequestCard({ req }: { req: (typeof requests)[0] }) {
    const slot = req.timetable_slots as unknown as {
      slot_number: number
      subjects: { name: string } | null
      sections: { name: string; grades: { name: string } | null } | null
    }
    return (
      <div
        className="px-5 py-4 rounded-xl"
        style={{ backgroundColor: 'var(--color-brand-cream)', border: '0.5px solid var(--color-brand-sand)' }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-brand-mocha)' }}>
          {slot?.subjects?.name ?? 'Unknown subject'}
        </p>
        <p className="text-xs" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
          Period {slot?.slot_number}
          {slot?.sections?.grades?.name ? ` · ${slot.sections.grades.name} ${slot.sections?.name}` : ''}
        </p>
        <p className="text-xs mt-1" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
          {format(new Date(req.date), 'MMM d, yyyy')}
        </p>
        <p className="text-xs mt-1" style={{ ...mono, color: 'var(--color-brand-clay)' }}>
          Absent: {(req.absent_teacher as unknown as { name: string })?.name}
        </p>
        {req.note_for_sub && (
          <p className="text-xs mt-2 italic" style={{ color: 'var(--color-brand-taupe)', opacity: 0.7 }}>
            &quot;{req.note_for_sub}&quot;
          </p>
        )}
      </div>
    )
  }

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-1" style={{ ...serif, color: 'var(--color-brand-mocha)' }}>
          Operations
        </h1>
        <p className="text-xs uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
          Absences & Substitutions
        </p>
      </div>

      {/* Two-column: open / filled */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Open */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-medium uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>
              Open
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest"
              style={{
                ...mono,
                backgroundColor: open.length > 0 ? 'rgba(198,154,107,0.15)' : 'rgba(60,53,48,0.07)',
                color: open.length > 0 ? 'var(--color-brand-warning)' : 'var(--color-brand-taupe)',
              }}
            >
              {open.length}
            </span>
          </div>
          <div className="space-y-3">
            {open.length === 0 ? (
              <div
                className="text-center py-10 rounded-xl text-xs uppercase tracking-widest"
                style={{ ...mono, color: 'var(--color-brand-taupe)', border: '0.5px dashed var(--color-brand-sand)' }}
              >
                No open requests
              </div>
            ) : (
              open.map((req) => <RequestCard key={req.id} req={req} />)
            )}
          </div>
        </div>

        {/* Filled */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-medium uppercase tracking-widest" style={{ ...mono, color: 'var(--color-brand-mocha)' }}>
              Filled
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest"
              style={{
                ...mono,
                backgroundColor: 'rgba(107,123,92,0.12)',
                color: 'var(--color-brand-success)',
              }}
            >
              {filled.length}
            </span>
          </div>
          <div className="space-y-3">
            {filled.length === 0 ? (
              <div
                className="text-center py-10 rounded-xl text-xs uppercase tracking-widest"
                style={{ ...mono, color: 'var(--color-brand-taupe)', border: '0.5px dashed var(--color-brand-sand)' }}
              >
                No filled requests
              </div>
            ) : (
              filled.map((req) => <RequestCard key={req.id} req={req} />)
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
