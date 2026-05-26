import { redirect } from 'next/navigation'
import { getRole } from '@/app/actions/auth'

export default async function Home() {
  const role = await getRole()

  if (role === 'admin') {
    redirect('/admin/timetable')
  } else if (role === 'teacher') {
    redirect('/teacher/dashboard')
  } else {
    redirect('/login')
  }
}
