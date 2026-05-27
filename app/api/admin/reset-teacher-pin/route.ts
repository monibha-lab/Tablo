import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  // Verify caller is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { teacherId } = await request.json()

  if (!teacherId) {
    return NextResponse.json({ error: 'Missing teacherId' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Look up teacher's user_id
  const { data: teacher, error: teacherError } = await admin
    .from('teachers')
    .select('user_id, name')
    .eq('id', teacherId)
    .single()

  if (teacherError || !teacher?.user_id) {
    return NextResponse.json({ error: 'Teacher not found or has no login account' }, { status: 404 })
  }

  // Generate a new PIN
  const newPin = generatePin()

  // Update their auth password
  const { error: updateError } = await admin.auth.admin.updateUserById(teacher.user_id, {
    password: newPin,
  })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, pin: newPin })
}
