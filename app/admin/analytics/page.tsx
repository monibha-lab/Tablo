import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/Card'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: teachers }, { data: rooms }, { data: timetable }] = await Promise.all([
    supabase.from('teachers').select('id, name, max_periods_per_day').eq('school_id', schoolId),
    supabase.from('rooms').select('id, name, max_simultaneous_use').eq('school_id', schoolId),
    supabase.from('timetables').select('id').eq('school_id', schoolId).eq('is_active', true).single(),
  ])

  const { data: slots } = timetable
    ? await supabase
        .from('timetable_slots')
        .select('teacher_id, room_id, slot_number')
        .eq('timetable_id', timetable.id)
        .not('subject_id', 'is', null)
    : { data: [] }

  // Teacher load calculation
  const teacherLoad = (teachers ?? []).map((t) => {
    const count = (slots ?? []).filter((s) => s.teacher_id === t.id).length
    const max = t.max_periods_per_day * 5
    const pct = max > 0 ? (count / max) * 100 : 0
    return { ...t, count, max, pct }
  })

  // Room utilisation
  const totalSlots = (slots ?? []).length > 0 ? 5 * 8 : 1
  const roomUtil = (rooms ?? []).map((r) => {
    const used = (slots ?? []).filter((s) => s.room_id === r.id).length
    const pct = (used / totalSlots) * 100
    return { ...r, used, pct }
  })

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Analytics</h1>
        <p className="text-taupe">Insights into your school timetable.</p>
      </div>

      <div className="space-y-8">
        {/* Teacher load */}
        <Card title="Teacher Load Balance">
          <div className="space-y-3 mt-2">
            {teacherLoad.map((t) => (
              <div key={t.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-espresso">{t.name}</span>
                  <span className="text-xs text-taupe">{t.count}/{t.max} periods</span>
                </div>
                <div className="h-2 bg-sand/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      t.pct > 100 ? 'bg-red-400' : t.pct > 80 ? 'bg-amber-400' : 'bg-mocha/60'
                    }`}
                    style={{ width: `${Math.min(t.pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {teacherLoad.length === 0 && (
              <p className="text-sm text-taupe text-center py-4">No teacher data available</p>
            )}
          </div>
        </Card>

        {/* Room utilisation */}
        <Card title="Room Utilisation">
          <div className="space-y-3 mt-2">
            {roomUtil.map((r) => (
              <div key={r.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-espresso">{r.name}</span>
                  <span className="text-xs text-taupe">{Math.round(r.pct)}%</span>
                </div>
                <div className="h-2 bg-sand/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mocha/60 rounded-full"
                    style={{ width: `${Math.min(r.pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {roomUtil.length === 0 && (
              <p className="text-sm text-taupe text-center py-4">No room data available</p>
            )}
          </div>
        </Card>

        {/* Free period heatmap placeholder */}
        <Card title="Free Period Heatmap">
          <p className="text-sm text-taupe mt-2">
            Heatmap shows teacher availability across the week. Generate a timetable to see data.
          </p>
        </Card>
      </div>
    </AppLayout>
  )
}
