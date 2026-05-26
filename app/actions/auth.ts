'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function signIn(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = signInSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

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
