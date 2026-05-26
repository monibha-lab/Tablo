import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { AdminEventsClient } from './AdminEventsClient'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: events }, { data: grades }, { data: sections }] = await Promise.all([
    supabase
      .from('admin_events')
      .select('*')
      .eq('school_id', schoolId)
      .order('date', { ascending: false }),
    supabase.from('grades').select('*').eq('school_id', schoolId).order('order_index'),
    supabase
      .from('sections')
      .select('*, grades(name, order_index)')
      .order('name'),
  ])

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <AdminEventsClient
        events={events ?? []}
        grades={grades ?? []}
        sections={sections ?? []}
        schoolId={schoolId ?? ''}
      />
    </AppLayout>
  )
}
