import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { RoomsClient } from './RoomsClient'

export default async function GradesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: grades }, { data: sections }, { data: teachers }] = await Promise.all([
    supabase.from('grades').select('*').eq('school_id', schoolId).order('order_index'),
    supabase
      .from('sections')
      .select('*, teachers(name)')
      .order('name'),
    supabase
      .from('teachers')
      .select('id, name')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <RoomsClient
        grades={grades ?? []}
        sections={sections ?? []}
        teachers={teachers ?? []}
        schoolId={schoolId ?? ''}
      />
    </AppLayout>
  )
}
