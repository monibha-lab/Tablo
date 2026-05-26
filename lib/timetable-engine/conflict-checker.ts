import { createAdminClient } from '@/lib/supabase/admin'
import type { ConflictReport } from './types'

export async function checkConflicts(
  schoolId: string,
  timetableId: string
): Promise<ConflictReport[]> {
  const supabase = createAdminClient()
  const conflicts: ConflictReport[] = []

  // Fetch all relevant data
  const [
    { data: fixedPeriods },
    { data: sectionSubjects },
    { data: sections },
    { data: teachers },
    { data: bellSchedule },
  ] = await Promise.all([
    supabase
      .from('fixed_periods')
      .select('*, teachers(name), sections(name), grades(name)')
      .eq('school_id', schoolId),
    supabase
      .from('section_subjects')
      .select('*, sections(name, grade_id), subjects(name)')
      .order('section_id'),
    supabase
      .from('sections')
      .select('*, grades!inner(school_id)')
      .eq('grades.school_id', schoolId),
    supabase
      .from('teachers')
      .select('*')
      .eq('school_id', schoolId),
    supabase
      .from('bell_schedules')
      .select('*, period_slots(*)')
      .eq('school_id', schoolId)
      .single(),
  ])

  const slotsPerDay = bellSchedule?.periods_per_day ?? 8
  const slotsPerWeek = slotsPerDay * 5

  // Check 1: Teacher assigned to two fixed slots at same day+period
  const teacherFixedSlots: Map<string, { day: number; slot: number; label: string }[]> = new Map()
  for (const fp of fixedPeriods ?? []) {
    if (fp.teacher_id && fp.day_of_week && fp.slot_number) {
      const key = fp.teacher_id
      if (!teacherFixedSlots.has(key)) teacherFixedSlots.set(key, [])
      teacherFixedSlots.get(key)!.push({
        day: fp.day_of_week,
        slot: fp.slot_number,
        label: fp.label || `Fixed slot D${fp.day_of_week}P${fp.slot_number}`,
      })
    }
  }

  for (const [teacherId, slots] of teacherFixedSlots) {
    const teacher = teachers?.find((t) => t.id === teacherId)
    const seen = new Set<string>()
    for (const slot of slots) {
      const key = `${slot.day}-${slot.slot}`
      if (seen.has(key)) {
        conflicts.push({
          severity: 'blocking',
          message: `Teacher "${teacher?.name ?? teacherId}" has conflicting fixed periods at Day ${slot.day}, Period ${slot.slot}`,
          affected: [teacherId],
        })
      }
      seen.add(key)
    }
  }

  // Check 2: Section subject load exceeds available slots
  for (const ss of sectionSubjects ?? []) {
    if (ss.periods_per_week > slotsPerWeek) {
      conflicts.push({
        severity: 'blocking',
        message: `Subject "${(ss.subjects as unknown as { name: string })?.name}" for section "${(ss.sections as unknown as { name: string })?.name}" requires ${ss.periods_per_week} periods but only ${slotsPerWeek} are available`,
        affected: [ss.section_id, ss.subject_id],
      })
    }
  }

  // Check 3: Sections missing class teacher when required
  for (const section of sections ?? []) {
    if (section.class_teacher_period_first && !section.class_teacher_id) {
      conflicts.push({
        severity: 'warning',
        message: `Section "${section.name}" requires homeroom first but has no class teacher assigned`,
        affected: [section.id],
      })
    }
  }

  return conflicts
}
