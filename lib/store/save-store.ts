import { create } from 'zustand'

interface SaveStore {
  isSaving: boolean
  lastSaved: Date | null
  setSaving: (saving: boolean) => void
  setSaved: () => void
}

export const useSaveStore = create<SaveStore>((set) => ({
  isSaving: false,
  lastSaved: null,
  setSaving: (saving) => set({ isSaving: saving }),
  setSaved: () => set({ isSaving: false, lastSaved: new Date() }),
}))
