import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { format, addWeeks } from 'date-fns'

const DAY_MAP: Record<number, string> = {
  1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: link } = await supabase
    .from('share_links')
    .select('*, sections(name, grades(name)), timetables(*, terms(start_date, end_date, name))')
    .eq('token', token)
    .single()

  if (!link || new Date(link.expires_at) < new Date()) {
    return new NextResponse('Link expired', { status: 404 })
  }

  const { data: slots } = await supabase
    .from('timetable_slots')
    .select('*, subjects(name), rooms(name), period_slots:slot_number(start_time, end_time)')
    .eq('timetable_id', link.timetable_id)
    .eq('section_id', link.section_id)
    .not('subject_id', 'is', null)

  const timetable = link.timetables as unknown as {
    terms: { start_date: string; end_date: string; name: string } | null
    label: string
  }
  const termStart = timetable?.terms?.start_date ?? format(new Date(), 'yyyy-MM-dd')
  const termEnd = timetable?.terms?.end_date ?? format(addWeeks(new Date(), 16), 'yyyy-MM-dd')

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tablo//School Timetable//EN',
    `X-WR-CALNAME:${(link.sections as unknown as { name: string })?.name} Timetable`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const slot of slots ?? []) {
    const subject = (slot.subjects as unknown as { name: string })?.name ?? 'Class'
    const room = (slot.rooms as unknown as { name: string })?.name
    const dayStr = DAY_MAP[slot.day_of_week] ?? 'MO'
    const uid = `${slot.id}@tablo.app`
    const dtStart = `DTSTART:${termStart.replace(/-/g, '')}T${('08:00').replace(':', '')}00`
    const dtEnd = `DTEND:${termStart.replace(/-/g, '')}T${('08:45').replace(':', '')}00`
    const until = termEnd.replace(/-/g, '') + 'T235959Z'

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      dtStart,
      dtEnd,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayStr};UNTIL=${until}`,
      `SUMMARY:${subject}`,
      room ? `LOCATION:${room}` : '',
      `DESCRIPTION:Period ${slot.slot_number}`,
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')

  return new NextResponse(lines.filter(Boolean).join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="timetable.ics"',
    },
  })
}
