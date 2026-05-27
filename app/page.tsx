import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRole } from '@/app/actions/auth'

export default async function Home() {
  const role = await getRole()

  if (role === 'admin') {
    // Check if the admin has already set up a school
    const supabase = await createClient()
    const { count } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true })
    redirect(count === 0 ? '/admin/setup' : '/admin/timetable')
  } else if (role === 'teacher') {
    redirect('/teacher/dashboard')
  } else {
    redirect('/login')
  }
}
