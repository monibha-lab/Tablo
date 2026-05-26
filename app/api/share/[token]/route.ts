import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { addDays } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: link } = await supabase
    .from('share_links')
    .select('*, sections(name, grades(name)), timetables(label)')
    .eq('token', token)
    .single()

  if (!link || new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expired or not found' }, { status: 404 })
  }

  return NextResponse.json({ link })
}

export async function POST(request: NextRequest) {
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sectionId, timetableId } = await request.json()
  const token = randomBytes(32).toString('hex')
  const expiresAt = addDays(new Date(), 30).toISOString()

  const supabase = createAdminClient()
  const { data: link } = await supabase
    .from('share_links')
    .insert({ token, section_id: sectionId, timetable_id: timetableId, expires_at: expiresAt })
    .select()
    .single()

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${token}`
  return NextResponse.json({ token, shareUrl, link })
}
