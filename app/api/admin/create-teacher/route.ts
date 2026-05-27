import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  // Verify caller is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { name, username, email, pin, schoolId, maxPeriods } = await request.json()

  if (!name || !username || !email || !pin || !schoolId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Create auth user with PIN as password
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { role: 'teacher', name },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // 2. Insert teacher record
  const { data: teacherRecord, error: dbError } = await admin.from('teachers').insert({
    school_id: schoolId,
    user_id: authUser.user.id,
    name,
    username,
    email,
    max_periods_per_day: maxPeriods ?? 6,
    is_active: true,
  }).select('id').single()

  if (dbError) {
    // Rollback auth user
    await admin.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, username, teacherId: teacherRecord?.id })
}
