export interface ConflictReport {
  severity: 'blocking' | 'warning'
  message: string
  affected: string[]
}

export interface WeekGrid {
  [sectionId: string]: DayGrid
}

export interface DayGrid {
  [day: number]: SlotGrid
}

export interface SlotGrid {
  [slot: number]: SlotAssignment | null
}

export interface SlotAssignment {
  subjectId: string | null
  teacherId: string | null
  roomId: string | null
  isFixed: boolean
  isCombined: boolean
  combinedClassId: string | null
  isElective: boolean
  electiveOfferingId: string | null
  isDoublePeriod: boolean
  isLocked: boolean
}

export interface EngineInput {
  timetableId: string
  schoolId: string
  termId: string
}

export interface EngineResult {
  status: 'success' | 'conflicts'
  generated?: number
  unassigned?: number
  warnings?: ConflictReport[]
  conflicts?: ConflictReport[]
}
