import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { SubjectsClient } from './SubjectsClient'

export default async function SubjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: subjects }, { data: sections }] = await Promise.all([
    supabase.from('subjects').select('*').eq('school_id', schoolId).order('name'),
    supabase
      .from('sections')
      .select('*, grades(name, order_index), section_subjects(subject_id, periods_per_week, allow_double_periods)')
      .order('name'),
  ])

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <SubjectsClient subjects={subjects ?? []} sections={sections ?? []} schoolId={schoolId ?? ''} />
    </AppLayout>
  )
}
