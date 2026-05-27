'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const signInSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function signIn(formData: FormData) {
  const raw = {
    identifier: (formData.get('identifier') as string)?.trim(),
    password: formData.get('password') as string,
  }

  const parsed = signInSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { identifier, password } = parsed.data
  let email = identifier

  // If not an email, look up the teacher's username to get their email
  if (!identifier.includes('@')) {
    const admin = createAdminClient()
    const { data: teacher } = await admin
      .from('teachers')
      .select('email')
      .eq('username', identifier)
      .maybeSingle()
    if (!teacher?.email) {
      return { error: 'Invalid username or password' }
    }
    email = teacher.email
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  const role = data.user?.user_metadata?.role

  if (role === 'admin') {
    // Check if school is set up
    const { count } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true })
    redirect(count === 0 ? '/admin/setup' : '/admin/timetable')
  } else if (role === 'teacher') {
    redirect('/teacher/dashboard')
  }

  redirect('/login')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getRole(): Promise<'admin' | 'teacher' | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (user?.user_metadata?.role as 'admin' | 'teacher') ?? null
}
