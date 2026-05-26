import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/Badge'
import { format, subMinutes } from 'date-fns'

export default async function SubstitutionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const admin = createAdminClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  // Lazy escalation: auto-escalate open requests older than 30 minutes
  const thirtyMinutesAgo = subMinutes(new Date(), 30).toISOString()
  await admin
    .from('substitution_requests')
    .update({ status: 'escalated' })
    .eq('status', 'open')
    .lt('created_at', thirtyMinutesAgo)

  const { data: requests } = await supabase
    .from('substitution_requests')
    .select(`
      *,
      absent_teacher:teachers!absent_teacher_id(name),
      timetable_slots(slot_number, subjects(name), sections(name, grades(name)))
    `)
    .order('created_at', { ascending: false })

  const byStatus = {
    open: (requests ?? []).filter((r) => r.status === 'open'),
    filled: (requests ?? []).filter((r) => r.status === 'filled'),
    escalated: (requests ?? []).filter((r) => r.status === 'escalated'),
  }

  const RequestCard = ({ req }: { req: (typeof requests)[0] }) => {
    const slot = req.timetable_slots as unknown as {
      slot_number: number
      subjects: { name: string } | null
      sections: { name: string; grades: { name: string } | null } | null
    }
    return (
      <div className="bg-ivory border border-sand/60 rounded-xl p-4">
        <p className="font-medium text-espresso text-sm">
          {slot?.subjects?.name ?? 'Unknown subject'}
        </p>
        <p className="text-xs text-taupe mt-0.5">
          Period {slot?.slot_number} • {slot?.sections?.grades?.name} {slot?.sections?.name}
        </p>
        <p className="text-xs text-taupe mt-1">{format(new Date(req.date), 'MMM d, yyyy')}</p>
        <p className="text-xs text-clay mt-1">
          Absent: {(req.absent_teacher as unknown as { name: string })?.name}
        </p>
        {req.note_for_sub && (
          <p className="text-xs text-taupe/70 mt-2 italic">&quot;{req.note_for_sub}&quot;</p>
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
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Substitutions</h1>
        <p className="text-taupe">Manage substitute teacher requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['open', 'filled', 'escalated'] as const).map((status) => (
          <div key={status}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-medium text-espresso capitalize">{status}</h2>
              <Badge
                variant={status === 'filled' ? 'success' : status === 'escalated' ? 'danger' : 'default'}
              >
                {byStatus[status].length}
              </Badge>
            </div>
            <div className="space-y-3">
              {byStatus[status].length === 0 ? (
                <p className="text-xs text-taupe text-center py-8 bg-cream/50 rounded-xl">
                  No {status} requests
                </p>
              ) : (
                byStatus[status].map((req) => <RequestCard key={req.id} req={req} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
