import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { TimetableEditor } from './TimetableEditor'

export default async function TimetableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [
    { data: timetable },
    { data: sections },
    { data: slots },
    { data: subjects },
    { data: teachers },
    { data: rooms },
    { data: periodSlots },
  ] = await Promise.all([
    supabase.from('timetables').select('*, terms(name)').eq('id', id).single(),
    supabase
      .from('sections')
      .select('*, grades!inner(name, school_id, order_index)')
      .eq('grades.school_id', schoolId)
      .order('name'),
    supabase
      .from('timetable_slots')
      .select('*')
      .eq('timetable_id', id),
    supabase.from('subjects').select('*').eq('school_id', schoolId),
    supabase.from('teachers').select('*').eq('school_id', schoolId),
    supabase.from('rooms').select('*').eq('school_id', schoolId),
    supabase
      .from('period_slots')
      .select('*, bell_schedules!inner(school_id)')
      .eq('bell_schedules.school_id', schoolId)
      .order('slot_number'),
  ])

  if (!timetable) redirect('/admin/timetable')

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <TimetableEditor
        timetable={timetable}
        sections={sections ?? []}
        slots={slots ?? []}
        subjects={subjects ?? []}
        teachers={teachers ?? []}
        rooms={rooms ?? []}
        periodSlots={periodSlots ?? []}
        schoolId={schoolId ?? ''}
      />
    </AppLayout>
  )
}
