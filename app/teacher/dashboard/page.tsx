import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { AppLayout } from '@/components/layout/AppLayout'
import { TeacherDashboard } from './TeacherDashboard'

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  if (!teacher) redirect('/login')

  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  // Convert to 1=Mon, ..., 5=Fri
  const schoolDay = dayOfWeek === 0 ? 1 : dayOfWeek === 6 ? 5 : dayOfWeek

  // Get published timetable
  const { data: timetable } = await supabase
    .from('timetables')
    .select('id')
    .eq('school_id', teacher.school_id)
    .eq('is_published', true)
    .eq('is_active', true)
    .single()

  const { data: todaySlots } = timetable
    ? await supabase
        .from('timetable_slots')
        .select('*, subjects(*), sections(*, grades(name)), rooms(*)')
        .eq('timetable_id', timetable.id)
        .eq('teacher_id', teacher.id)
        .eq('day_of_week', schoolDay)
        .not('subject_id', 'is', null)
    : { data: [] }

  const { data: periodSlots } = await supabase
    .from('period_slots')
    .select('*, bell_schedules!inner(school_id)')
    .eq('bell_schedules.school_id', teacher.school_id)
    .eq('is_break', false)
    .order('slot_number')

  return (
    <AppLayout
      schoolName={(teacher.schools as unknown as { name: string })?.name}
      userName={teacher.name}
      userRole="teacher"
    >
      <TeacherDashboard
        teacher={teacher}
        todaySlots={todaySlots ?? []}
        periodSlots={periodSlots ?? []}
        today={format(today, 'EEEE, MMMM d, yyyy')}
      />
    </AppLayout>
  )
}
