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

  const [{ data: teachers }, { data: subjects }, { data: grades }] = await Promise.all([
    supabase
      .from('teachers')
      .select('*, teacher_subjects(subject_id, grade_id)')
      .eq('school_id', schoolId)
      .order('name'),
    supabase.from('subjects').select('*').eq('school_id', schoolId),
    supabase.from('grades').select('*').eq('school_id', schoolId).order('order_index'),
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
        schoolId={schoolId ?? ''}
      />
    </AppLayout>
  )
}
