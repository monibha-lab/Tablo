import { createAdminClient } from '@/lib/supabase/admin'
import type { WeekGrid, SlotAssignment, ConflictReport } from './types'

const DAYS = [1, 2, 3, 4, 5]

export async function generateTimetable(
  timetableId: string,
  schoolId: string
): Promise<{ generated: number; unassigned: number; warnings: ConflictReport[] }> {
  const supabase = createAdminClient()
  const warnings: ConflictReport[] = []

  // Fetch all required data
  const [
    { data: sections },
    { data: sectionSubjects },
    { data: fixedPeriods },
    { data: teachers },
    { data: bellSchedule },
    { data: combinedClasses },
    { data: combinedClassSections },
    { data: electiveBlocks },
    { data: electiveEnrollments },
    { data: teacherSubjects },
    { data: rooms },
  ] = await Promise.all([
    supabase
      .from('sections')
      .select('*, grades!inner(school_id, id)')
      .eq('grades.school_id', schoolId),
    supabase
      .from('section_subjects')
      .select('*')
      .in('section_id', (await supabase.from('sections').select('id').eq('grades.school_id', schoolId).select('id')).data?.map(s => s.id) ?? []),
    supabase
      .from('fixed_periods')
      .select('*')
      .eq('school_id', schoolId),
    supabase
      .from('teachers')
      .select('*')
      .eq('school_id', schoolId),
    supabase
      .from('bell_schedules')
      .select('*, period_slots(*)')
      .eq('school_id', schoolId)
      .single(),
    supabase
      .from('combined_classes')
      .select('*')
      .eq('school_id', schoolId),
    supabase
      .from('combined_class_sections')
      .select('*'),
    supabase
      .from('elective_blocks')
      .select('*')
      .eq('school_id', schoolId),
    supabase
      .from('elective_enrollments')
      .select('*'),
    supabase
      .from('teacher_subjects')
      .select('*')
      .eq('school_id', schoolId),
    supabase
      .from('rooms')
      .select('*')
      .eq('school_id', schoolId),
  ])

  const periodsPerDay = bellSchedule?.periods_per_day ?? 8
  const sectionIds = (sections ?? []).map((s) => s.id)

  // Initialize empty grid: section → day → slot → assignment
  const grid: WeekGrid = {}
  for (const sectionId of sectionIds) {
    grid[sectionId] = {}
    for (const day of DAYS) {
      grid[sectionId][day] = {}
      for (let slot = 1; slot <= periodsPerDay; slot++) {
        grid[sectionId][day][slot] = null
      }
    }
  }

  // Track teacher daily load
  const teacherDailyLoad: Map<string, Map<string, number>> = new Map()
  const teacherMaxLoad: Map<string, number> = new Map()
  for (const t of teachers ?? []) {
    teacherDailyLoad.set(t.id, new Map())
    teacherMaxLoad.set(t.id, t.max_periods_per_day)
  }

  function incTeacherLoad(teacherId: string, dayKey: string) {
    const dayMap = teacherDailyLoad.get(teacherId) ?? new Map()
    dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + 1)
    teacherDailyLoad.set(teacherId, dayMap)
  }

  function isTeacherAvailable(teacherId: string, day: number, slot: number): boolean {
    const dayKey = `${day}`
    const load = teacherDailyLoad.get(teacherId)?.get(dayKey) ?? 0
    const maxLoad = teacherMaxLoad.get(teacherId) ?? 6

    if (load >= maxLoad) return false

    // Check if teacher is already busy in this slot in any other section
    for (const sectionId of sectionIds) {
      const assignment = grid[sectionId]?.[day]?.[slot]
      if (assignment?.teacherId === teacherId) return false
    }
    return true
  }

  // Phase 1: Place fixed periods
  for (const fp of fixedPeriods ?? []) {
    if (!fp.day_of_week || !fp.slot_number) continue

    const targetSections: string[] = []
    if (fp.applies_to === 'section' && fp.section_id) {
      targetSections.push(fp.section_id)
    } else if (fp.applies_to === 'grade' && fp.grade_id) {
      targetSections.push(
        ...(sections ?? [])
          .filter((s) => s.grade_id === fp.grade_id)
          .map((s) => s.id)
      )
    } else if (fp.applies_to === 'school') {
      targetSections.push(...sectionIds)
    }

    for (const sectionId of targetSections) {
      if (!grid[sectionId]) continue
      grid[sectionId][fp.day_of_week][fp.slot_number] = {
        subjectId: fp.subject_id,
        teacherId: fp.teacher_id,
        roomId: fp.room_id,
        isFixed: true,
        isCombined: false,
        combinedClassId: null,
        isElective: false,
        electiveOfferingId: null,
        isDoublePeriod: false,
        isLocked: false,
      }
      if (fp.teacher_id) {
        incTeacherLoad(fp.teacher_id, `${fp.day_of_week}`)
      }
    }
  }

  // Phase 2: Place elective blocks
  for (const eb of electiveBlocks ?? []) {
    const enrolledSections = (electiveEnrollments ?? []).filter(
      (e) => e.elective_block_id === eb.id
    )
    for (const enrollment of enrolledSections) {
      if (!grid[enrollment.section_id]) continue
      grid[enrollment.section_id][eb.day_of_week][eb.slot_number] = {
        subjectId: null,
        teacherId: null,
        roomId: null,
        isFixed: false,
        isCombined: false,
        combinedClassId: null,
        isElective: true,
        electiveOfferingId: enrollment.offering_id,
        isDoublePeriod: false,
        isLocked: false,
      }
    }
  }

  // Phase 3: Fill remaining slots greedily
  for (const section of sections ?? []) {
    const subjectsForSection = (sectionSubjects ?? []).filter(
      (ss) => ss.section_id === section.id
    )

    // Count how many of each subject we still need to place
    const remaining: Map<string, number> = new Map()
    for (const ss of subjectsForSection) {
      // Count already placed
      let placed = 0
      for (const day of DAYS) {
        for (let slot = 1; slot <= periodsPerDay; slot++) {
          const assignment = grid[section.id]?.[day]?.[slot]
          if (assignment?.subjectId === ss.subject_id) placed++
        }
      }
      const needed = ss.periods_per_week - placed
      if (needed > 0) remaining.set(ss.subject_id, needed)
    }

    // Fill empty slots
    for (const day of DAYS) {
      for (let slot = 1; slot <= periodsPerDay; slot++) {
        if (grid[section.id]?.[day]?.[slot] !== null) continue

        // Find the subject with most remaining periods
        let bestSubjectId: string | null = null
        let bestCount = 0
        for (const [subjectId, count] of remaining) {
          if (count > bestCount) {
            bestCount = count
            bestSubjectId = subjectId
          }
        }

        if (!bestSubjectId) continue

        // Find available teacher for this subject
        const eligibleTeacherIds = (teacherSubjects ?? [])
          .filter((ts) => ts.subject_id === bestSubjectId)
          .map((ts) => ts.teacher_id as string)

        let teacherId: string | null = null
        for (const tid of eligibleTeacherIds) {
          if (isTeacherAvailable(tid, day, slot)) {
            teacherId = tid
            incTeacherLoad(tid, `${day}`)
            break
          }
        }

        // Find an available room for this slot
        const bookedRoomIds = new Set(
          sectionIds
            .map((sid) => grid[sid]?.[day]?.[slot]?.roomId)
            .filter(Boolean)
        )
        const availableRoom = (rooms ?? []).find((r) => !bookedRoomIds.has(r.id))
        const roomId: string | null = availableRoom?.id ?? null

        grid[section.id][day][slot] = {
          subjectId: bestSubjectId,
          teacherId,
          roomId,
          isFixed: false,
          isCombined: false,
          combinedClassId: null,
          isElective: false,
          electiveOfferingId: null,
          isDoublePeriod: false,
          isLocked: false,
        }

        const prev = remaining.get(bestSubjectId) ?? 0
        if (prev <= 1) {
          remaining.delete(bestSubjectId)
        } else {
          remaining.set(bestSubjectId, prev - 1)
        }
      }
    }

    // Record any unresolved subjects as warnings
    for (const [subjectId, count] of remaining) {
      warnings.push({
        severity: 'warning',
        message: `Could not place all ${count} periods for subject in section ${section.name}`,
        affected: [section.id, subjectId],
      })
    }
  }

  // Phase 4: Save all slots to DB
  const slotsToInsert = []
  let generated = 0
  let unassigned = 0

  for (const sectionId of sectionIds) {
    for (const day of DAYS) {
      for (let slot = 1; slot <= periodsPerDay; slot++) {
        const assignment: SlotAssignment | null = grid[sectionId]?.[day]?.[slot] ?? null
        slotsToInsert.push({
          timetable_id: timetableId,
          section_id: sectionId,
          day_of_week: day,
          slot_number: slot,
          subject_id: assignment?.subjectId ?? null,
          teacher_id: assignment?.teacherId ?? null,
          room_id: assignment?.roomId ?? null,
          is_double_period: assignment?.isDoublePeriod ?? false,
          is_fixed: assignment?.isFixed ?? false,
          is_combined: assignment?.isCombined ?? false,
          combined_class_id: assignment?.combinedClassId ?? null,
          is_elective: assignment?.isElective ?? false,
          elective_offering_id: assignment?.electiveOfferingId ?? null,
          is_locked: assignment?.isLocked ?? false,
        })
        if (assignment?.subjectId) {
          generated++
        } else {
          unassigned++
        }
      }
    }
  }

  // Insert in batches of 100
  for (let i = 0; i < slotsToInsert.length; i += 100) {
    await supabase.from('timetable_slots').insert(slotsToInsert.slice(i, i + 100))
  }

  // Create automatic snapshot
  await supabase.from('timetable_snapshots').insert({
    timetable_id: timetableId,
    snapshot_data: grid as unknown as Record<string, unknown>,
    label: `Auto-snapshot ${new Date().toISOString()}`,
  })

  return { generated, unassigned, warnings }
}
