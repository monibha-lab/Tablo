import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'

export default async function TeacherTimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  if (!teacher) redirect('/login')

  const { data: timetable } = await supabase
    .from('timetables')
    .select('id')
    .eq('school_id', teacher.school_id)
    .eq('is_published', true)
    .eq('is_active', true)
    .single()

  const [{ data: slots }, { data: subjects }, { data: rooms }, { data: sections }, { data: periodSlots }] =
    await Promise.all([
      timetable
        ? supabase
            .from('timetable_slots')
            .select('*')
            .eq('timetable_id', timetable.id)
            .eq('teacher_id', teacher.id)
        : { data: [] },
      supabase.from('subjects').select('*').eq('school_id', teacher.school_id),
      supabase.from('rooms').select('*').eq('school_id', teacher.school_id),
      supabase
        .from('sections')
        .select('*, grades(name)')
        .order('name'),
      supabase
        .from('period_slots')
        .select('*, bell_schedules!inner(school_id)')
        .eq('bell_schedules.school_id', teacher.school_id)
        .eq('is_break', false)
        .order('slot_number'),
    ])

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const subjectMap = Object.fromEntries((subjects ?? []).map((s) => [s.id, s]))
  const roomMap = Object.fromEntries((rooms ?? []).map((r) => [r.id, r]))
  const sectionMap = Object.fromEntries((sections ?? []).map((s) => [s.id, s]))

  return (
    <AppLayout
      schoolName={(teacher.schools as unknown as { name: string })?.name}
      userName={teacher.name}
      userRole="teacher"
    >
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-semibold text-espresso">My Timetable</h1>
      </div>

      {!timetable ? (
        <p className="text-taupe text-center py-16">No published timetable available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1.5">
            <thead>
              <tr>
                <th className="w-24 text-xs text-taupe font-medium text-left pb-2">Period</th>
                {DAYS.map((day) => (
                  <th key={day} className="text-xs text-taupe font-medium text-center pb-2">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(periodSlots ?? []).map((period) => (
                <tr key={period.slot_number}>
                  <td className="align-top pr-2">
                    <p className="text-xs font-medium text-espresso">{period.label}</p>
                    <p className="text-[10px] text-taupe">{period.start_time?.slice(0, 5)}</p>
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const day = dayIdx + 1
                    const slot = (slots ?? []).find(
                      (s) => s.day_of_week === day && s.slot_number === period.slot_number
                    )
                    const subject = slot?.subject_id ? subjectMap[slot.subject_id] : null
                    const room = slot?.room_id ? roomMap[slot.room_id] : null
                    const section = slot?.section_id ? sectionMap[slot.section_id] : null

                    return (
                      <td key={day} className="align-top">
                        {subject ? (
                          <div
                            className="h-24 border border-sand/40 rounded-lg px-2.5 py-2 bg-champagne/40"
                            style={{ borderLeftColor: subject.color_hex, borderLeftWidth: 3 }}
                          >
                            <p className="text-xs font-semibold text-espresso truncate">{subject.name}</p>
                            {section && (
                              <p className="text-[10px] text-taupe mt-0.5">
                                {(section.grades as unknown as { name: string })?.name} {section.name}
                              </p>
                            )}
                            {room && <p className="text-[10px] text-taupe/80">{room.name}</p>}
                          </div>
                        ) : (
                          <div className="h-24 border border-sand/20 rounded-lg bg-ivory" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  )
}
