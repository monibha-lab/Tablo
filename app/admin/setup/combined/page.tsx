import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { CombinedClient } from './CombinedClient'

export default async function CombinedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: combined }, { data: sections }, { data: rooms }] = await Promise.all([
    supabase
      .from('combined_classes')
      .select('*, combined_class_sections(section_id, sections(name, grades(name))), rooms(name)')
      .eq('school_id', schoolId),
    supabase.from('sections').select('*, grades(name)').order('name'),
    supabase.from('rooms').select('*').eq('school_id', schoolId),
  ])

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <CombinedClient combined={combined ?? []} sections={sections ?? []} rooms={rooms ?? []} schoolId={schoolId ?? ''} />
    </AppLayout>
  )
}
