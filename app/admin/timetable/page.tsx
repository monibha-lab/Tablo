import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { TimetableList } from './TimetableList'

export default async function TimetablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: timetables }, { data: terms }] = await Promise.all([
    supabase
      .from('timetables')
      .select('*, terms(name)')
      .eq('school_id', schoolId)
      .order('generated_at', { ascending: false }),
    supabase
      .from('terms')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
  ])

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <TimetableList
        timetables={timetables ?? []}
        terms={terms ?? []}
        schoolId={schoolId ?? ''}
      />
    </AppLayout>
  )
}
