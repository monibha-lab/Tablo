import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { FixedPeriodsClient } from './FixedPeriodsClient'

export default async function FixedPeriodsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: fixedPeriods }, { data: subjects }, { data: teachers }, { data: rooms }, { data: sections }, { data: grades }] =
    await Promise.all([
      supabase
        .from('fixed_periods')
        .select('*, subjects(name), teachers(name), rooms(name), sections(name), grades(name)')
        .eq('school_id', schoolId),
      supabase.from('subjects').select('*').eq('school_id', schoolId),
      supabase.from('teachers').select('id, name').eq('school_id', schoolId).eq('is_active', true),
      supabase.from('rooms').select('*').eq('school_id', schoolId),
      supabase.from('sections').select('*, grades(name)').order('name'),
      supabase.from('grades').select('*').eq('school_id', schoolId).order('order_index'),
    ])

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <FixedPeriodsClient
        fixedPeriods={fixedPeriods ?? []}
        subjects={subjects ?? []}
        teachers={teachers ?? []}
        rooms={rooms ?? []}
        sections={sections ?? []}
        grades={grades ?? []}
        schoolId={schoolId ?? ''}
      />
    </AppLayout>
  )
}
