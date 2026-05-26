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
    .select('*, sections(name, grades(name)), timetables(*, terms(start_date, end_date, name), bell_schedule_id)')
    .eq('token', token)
    .single()

  if (!link || new Date(link.expires_at) < new Date()) {
    return new NextResponse('Link expired', { status: 404 })
  }

  const timetable = link.timetables as unknown as {
    terms: { start_date: string; end_date: string; name: string } | null
    label: string
    bell_schedule_id: string | null
  }

  // Fetch slots and period times separately
  const [{ data: slots }, { data: periodSlots }] = await Promise.all([
    supabase
      .from('timetable_slots')
      .select('*, subjects(name), rooms(name)')
      .eq('timetable_id', link.timetable_id)
      .eq('section_id', link.section_id)
      .not('subject_id', 'is', null),
    timetable.bell_schedule_id
      ? supabase
          .from('period_slots')
          .select('slot_number, start_time, end_time')
          .eq('bell_schedule_id', timetable.bell_schedule_id)
          .eq('is_break', false)
          .order('slot_number')
      : Promise.resolve({ data: [] }),
  ])

  const periodTimeMap = new Map(
    (periodSlots ?? []).map((p) => [p.slot_number, { start: p.start_time, end: p.end_time }])
  )

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
    const dateStr = termStart.replace(/-/g, '')
    const until = termEnd.replace(/-/g, '') + 'T235959Z'

    const times = periodTimeMap.get(slot.slot_number)
    const startTime = times?.start ? times.start.replace(':', '').slice(0, 4) + '00' : '080000'
    const endTime = times?.end ? times.end.replace(':', '').slice(0, 4) + '00' : '084500'

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${dateStr}T${startTime}`,
      `DTEND:${dateStr}T${endTime}`,
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
