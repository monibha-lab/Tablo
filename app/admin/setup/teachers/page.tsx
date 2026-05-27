import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { TeachersClient } from './TeachersClient'

export default async function TeachersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: teachers }, { data: subjects }, { data: grades }, { data: sections }] = await Promise.all([
    supabase
      .from('teachers')
      .select('id, name, email, username, is_active, max_periods_per_day, teacher_subjects(subject_id, grade_id)')
      .eq('school_id', schoolId)
      .order('name'),
    supabase.from('subjects').select('*').eq('school_id', schoolId),
    supabase.from('grades').select('*').eq('school_id', schoolId).order('order_index'),
    supabase.from('sections').select('id, name, grade_id').order('name'),
  ])

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <TeachersClient
        teachers={teachers ?? []}
        subjects={subjects ?? []}
        grades={grades ?? []}
        sections={sections ?? []}
        schoolId={schoolId ?? ''}
      />
    </AppLayout>
  )
}
