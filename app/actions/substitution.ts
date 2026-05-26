'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function markAbsent(teacherId: string, date: string, reason?: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Insert absence
  const { error } = await supabase.from('teacher_absences').insert({
    teacher_id: teacherId,
    date,
    reason,
  })

  if (error) return { error: error.message }

  // Get timetable for that day
  const dayOfWeek = new Date(date).getDay() || 7 // Convert to 1=Mon
  const { data: teacher } = await admin.from('teachers').select('school_id').eq('id', teacherId).single()
  const { data: timetable } = await admin
    .from('timetables')
    .select('id')
    .eq('school_id', teacher?.school_id ?? '')
    .eq('is_published', true)
    .single()

  if (!timetable) return { success: true }

  const { data: slots } = await admin
    .from('timetable_slots')
    .select('*')
    .eq('timetable_id', timetable.id)
    .eq('teacher_id', teacherId)
    .eq('day_of_week', dayOfWeek)

  // Create substitution requests
  for (const slot of slots ?? []) {
    const { data: req } = await admin
      .from('substitution_requests')
      .insert({
        timetable_slot_id: slot.id,
        date,
        absent_teacher_id: teacherId,
        status: 'open',
      })
      .select()
      .single()

    if (req) {
      // Find available teachers
      const { data: busyTeachers } = await admin
        .from('timetable_slots')
        .select('teacher_id')
        .eq('timetable_id', timetable.id)
        .eq('day_of_week', slot.day_of_week)
        .eq('slot_number', slot.slot_number)
        .not('teacher_id', 'is', null)

      const busyIds = (busyTeachers ?? []).map((t) => t.teacher_id)

      const { data: availableTeachers } = await admin
        .from('teachers')
        .select('id, user_id')
        .eq('school_id', teacher?.school_id ?? '')
        .eq('is_active', true)
        .not('id', 'in', `(${[teacherId, ...busyIds.filter(Boolean)].join(',')})`)

      // Send notifications
      for (const avail of availableTeachers ?? []) {
        if (avail.user_id) {
          await admin.from('notifications').insert({
            user_id: avail.user_id,
            type: 'sub_request',
            title: 'Sub request available',
            body: `A substitute is needed for period ${slot.slot_number} on ${date}`,
            data: { request_id: req.id },
          })
        }
      }

      // Schedule escalation after 30 minutes via async (non-blocking)
      scheduleEscalation(req.id, 30 * 60 * 1000)
    }
  }

  return { success: true }
}

function scheduleEscalation(requestId: string, delayMs: number) {
  setTimeout(async () => {
    const admin = createAdminClient()
    const { data: req } = await admin
      .from('substitution_requests')
      .select('status')
      .eq('id', requestId)
      .single()

    if (req?.status === 'open') {
      await admin
        .from('substitution_requests')
        .update({ status: 'escalated' })
        .eq('id', requestId)
    }
  }, delayMs)
}

export async function acceptSubstitution(requestId: string, substituteTeacherId: string) {
  const admin = createAdminClient()

  const { data: req } = await admin
    .from('substitution_requests')
    .select('status, absent_teacher_id')
    .eq('id', requestId)
    .single()

  if (req?.status !== 'open') return { error: 'Request is no longer available' }

  // Create assignment
  await admin.from('substitution_assignments').insert({
    request_id: requestId,
    substitute_teacher_id: substituteTeacherId,
    status: 'accepted',
    accepted_at: new Date().toISOString(),
  })

  // Update request status
  await admin.from('substitution_requests').update({ status: 'filled' }).eq('id', requestId)

  return { success: true }
}

export async function withdrawSubstitution(assignmentId: string) {
  const admin = createAdminClient()

  const { data: assignment } = await admin
    .from('substitution_assignments')
    .select('request_id')
    .eq('id', assignmentId)
    .single()

  if (!assignment) return { error: 'Assignment not found' }

  await admin
    .from('substitution_assignments')
    .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
    .eq('id', assignmentId)

  await admin
    .from('substitution_requests')
    .update({ status: 'open' })
    .eq('id', assignment.request_id)

  return { success: true }
}
