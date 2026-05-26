import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { ElectivesClient } from './ElectivesClient'

export default async function ElectivesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: blocks }, { data: subjects }, { data: teachers }, { data: rooms }, { data: sections }] =
    await Promise.all([
      supabase
        .from('elective_blocks')
        .select('*, elective_offerings(*, subjects(name), teachers(name), rooms(name))')
        .eq('school_id', schoolId)
        .order('day_of_week'),
      supabase.from('subjects').select('*').eq('school_id', schoolId),
      supabase.from('teachers').select('id, name').eq('school_id', schoolId).eq('is_active', true),
      supabase.from('rooms').select('*').eq('school_id', schoolId),
      supabase.from('sections').select('*, grades(name)').order('name'),
    ])

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <ElectivesClient
        blocks={blocks ?? []}
        subjects={subjects ?? []}
        teachers={teachers ?? []}
        rooms={rooms ?? []}
        sections={sections ?? []}
        schoolId={schoolId ?? ''}
      />
    </AppLayout>
  )
}
