'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import type { Room } from '@/types'

interface CombinedClientProps {
  combined: unknown[]
  sections: { id: string; name: string; grades: { name: string } | null }[]
  rooms: Room[]
  schoolId: string
}

export function CombinedClient({ combined, sections, rooms, schoolId }: CombinedClientProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  function toggleSection(id: string) {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    if (!name || selectedSections.length < 2) return
    setSaving(true)

    const { data: cc } = await supabase
      .from('combined_classes')
      .insert({ school_id: schoolId, name, room_id: roomId || null })
      .select()
      .single()

    if (cc) {
      await supabase.from('combined_class_sections').insert(
        selectedSections.map((sid) => ({ combined_class_id: cc.id, section_id: sid }))
      )
    }

    toast({ variant: 'success', title: 'Combined class created' })
    setSaving(false); setPanelOpen(false)
    setName(''); setRoomId(''); setSelectedSections([])
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteId) return
    await supabase.from('combined_classes').delete().eq('id', deleteId)
    setDeleteId(null); toast({ variant: 'success', title: 'Combined class removed' }); router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-espresso mb-2">Combined Classes</h1>
          <p className="text-taupe">Groups of sections that share a period together.</p>
        </div>
        <Button onClick={() => setPanelOpen(true)}><Plus className="h-4 w-4" /> Add combined class</Button>
      </div>

      <div className="space-y-3">
        {(combined as {
          id: string; name: string;
          rooms: { name: string } | null;
          combined_class_sections: { section_id: string; sections: { name: string; grades: { name: string } | null } | null }[];
        }[]).map((cc) => (
          <div key={cc.id} className="bg-ivory border border-sand/60 rounded-xl p-4 flex items-start gap-4">
            <Layers className="h-4 w-4 text-taupe flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-espresso">{cc.name}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {cc.combined_class_sections.map((ccs) => (
                  <span key={ccs.section_id} className="text-xs bg-sand/50 text-mocha px-2 py-0.5 rounded-full">
                    {ccs.sections?.grades?.name} {ccs.sections?.name}
                  </span>
                ))}
              </div>
              {cc.rooms && <p className="text-xs text-taupe mt-1">{cc.rooms.name}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDeleteId(cc.id)}>
              <Trash2 className="h-4 w-4 text-clay" />
            </Button>
          </div>
        ))}
        {combined.length === 0 && <div className="text-center py-16 text-taupe">No combined classes yet.</div>}
      </div>

      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Add combined class"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={selectedSections.length < 2}>
              Create (need ≥ 2 sections)
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 6 Elective Block" required />
          <Select label="Room (optional)" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">— None —</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <div>
            <label className="text-sm font-medium text-espresso block mb-2">Sections (select ≥ 2)</label>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {sections.map((s) => (
                <label key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(s.id)}
                    onChange={() => toggleSection(s.id)}
                    className="rounded border-sand"
                  />
                  <span className="text-sm text-espresso">{s.grades?.name} {s.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </SlidePanel>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Remove combined class" description="This group will be dissolved." confirmLabel="Remove" danger />
    </div>
  )
}
