import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers')
    .select('*, schools(*)')
    .eq('user_id', user.id)
    .single()

  const schoolId = teacher?.school_id

  const [{ data: terms }, { data: snapshots }] = await Promise.all([
    supabase.from('terms').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
    supabase
      .from('timetable_snapshots')
      .select('*, timetables(label)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <AppLayout
      schoolName={(teacher?.schools as unknown as { name: string })?.name}
      userName={teacher?.name}
      userRole="admin"
    >
      <SettingsClient
        school={(teacher?.schools as unknown as { id: string; name: string; logo_url: string | null }) ?? null}
        terms={terms ?? []}
        snapshots={snapshots ?? []}
      />
    </AppLayout>
  )
}
