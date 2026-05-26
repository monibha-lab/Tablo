import { create } from 'zustand'

interface WizardState {
  step: number
  schoolName: string
  logoUrl: string | null
  bellSchedule: {
    schoolStart: string
    schoolEnd: string
    periodDuration: number
    periodsPerDay: number
    breaks: { name: string; after: number; duration: number }[]
    hasAssembly: boolean
  }
  rooms: { name: string; type: string; maxSimultaneousUse: number }[]
  teachers: {
    name: string
    email: string
    subjects: string[]
    grades: string[]
    maxPeriods: number
  }[]
  grades: {
    name: string
    sections: {
      name: string
      classTeacher: string | null
      homeroomFirst: boolean
      subjects: { subjectId: string; periodsPerWeek: number; allowDouble: boolean }[]
    }[]
  }[]
  // IDs from DB after creation
  schoolId: string | null
  termId: string | null

  setStep: (step: number) => void
  setSchoolName: (name: string) => void
  setLogoUrl: (url: string | null) => void
  setBellSchedule: (schedule: WizardState['bellSchedule']) => void
  setRooms: (rooms: WizardState['rooms']) => void
  setTeachers: (teachers: WizardState['teachers']) => void
  setGrades: (grades: WizardState['grades']) => void
  setSchoolId: (id: string) => void
  setTermId: (id: string) => void
}

export const useWizardStore = create<WizardState>((set) => ({
  step: 1,
  schoolName: '',
  logoUrl: null,
  bellSchedule: {
    schoolStart: '08:00',
    schoolEnd: '15:00',
    periodDuration: 45,
    periodsPerDay: 8,
    breaks: [],
    hasAssembly: false,
  },
  rooms: [],
  teachers: [],
  grades: [],
  schoolId: null,
  termId: null,

  setStep: (step) => set({ step }),
  setSchoolName: (schoolName) => set({ schoolName }),
  setLogoUrl: (logoUrl) => set({ logoUrl }),
  setBellSchedule: (bellSchedule) => set({ bellSchedule }),
  setRooms: (rooms) => set({ rooms }),
  setTeachers: (teachers) => set({ teachers }),
  setGrades: (grades) => set({ grades }),
  setSchoolId: (schoolId) => set({ schoolId }),
  setTermId: (termId) => set({ termId }),
}))
