import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { TimetablePDF } from '@/lib/export/pdf'
import { format } from 'date-fns'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ timetableId: string; sectionId: string }> }
) {
  const { timetableId, sectionId } = await params

  // Auth check (allow public share links too via query token, but admin/teacher for direct)
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  const [
    { data: timetable },
    { data: section },
    { data: slots },
    { data: periodSlots },
  ] = await Promise.all([
    supabase
      .from('timetables')
      .select('*, terms(name), schools(name)')
      .eq('id', timetableId)
      .single(),
    supabase
      .from('sections')
      .select('*, grades(name)')
      .eq('id', sectionId)
      .single(),
    supabase
      .from('timetable_slots')
      .select('*, subjects(name, color_hex), teachers(name), rooms(name)')
      .eq('timetable_id', timetableId)
      .eq('section_id', sectionId),
    supabase
      .from('period_slots')
      .select('*')
      .eq('is_break', false)
      .order('slot_number'),
  ])

  if (!timetable || !section) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const term = timetable.terms as unknown as { name: string } | null
  const school = timetable.schools as unknown as { name: string } | null
  const grade = section.grades as unknown as { name: string } | null

  const pdfSlots = (slots ?? []).map((s) => ({
    day_of_week: s.day_of_week,
    slot_number: s.slot_number,
    subject_name: (s.subjects as unknown as { name: string } | null)?.name ?? null,
    teacher_name: (s.teachers as unknown as { name: string } | null)?.name ?? null,
    room_name: (s.rooms as unknown as { name: string } | null)?.name ?? null,
    color_hex: (s.subjects as unknown as { color_hex: string } | null)?.color_hex ?? null,
  }))

  const buffer = await renderToBuffer(
    React.createElement(TimetablePDF, {
      schoolName: school?.name ?? 'School',
      sectionName: section.name,
      gradeName: grade?.name ?? '',
      termName: term?.name ?? '',
      generatedAt: format(new Date(), 'MMM d, yyyy'),
      periodSlots: (periodSlots ?? []).map((p) => ({
        label: p.label,
        start_time: p.start_time,
        slot_number: p.slot_number,
      })),
      slots: pdfSlots,
    })
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${grade?.name ?? 'Grade'}-${section.name}-timetable.pdf"`,
    },
  })
}
