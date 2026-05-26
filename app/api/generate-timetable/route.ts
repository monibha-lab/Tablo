import { NextRequest, NextResponse } from 'next/server'
import { checkConflicts, generateTimetable } from '@/lib/timetable-engine'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { timetableId, schoolId, termId } = await request.json()

  if (!timetableId || !schoolId || !termId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Pre-check conflicts
  const conflicts = await checkConflicts(schoolId, timetableId)
  const blockingConflicts = conflicts.filter((c) => c.severity === 'blocking')

  if (blockingConflicts.length > 0) {
    return NextResponse.json(
      { status: 'conflicts', conflicts },
      { status: 422 }
    )
  }

  // Generate timetable
  const result = await generateTimetable(timetableId, schoolId)

  return NextResponse.json({
    status: 'success',
    ...result,
    warnings: [...conflicts.filter((c) => c.severity === 'warning'), ...(result.warnings ?? [])],
  })
}
