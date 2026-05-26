'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useWizardStore } from '@/lib/store/wizard-store'
import { createClient } from '@/lib/supabase/client'

export function Step1School() {
  const { schoolName, setSchoolName, setLogoUrl, setSchoolId, setStep } = useWizardStore()
  const [name, setName] = useState(schoolName)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `logos/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('school-assets').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('school-assets').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    }
    setUploading(false)
  }

  async function handleNext() {
    if (!name.trim()) {
      setError('School name is required')
      return
    }
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Create school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({ name: name.trim() })
      .select()
      .single()

    if (schoolError || !school) {
      setError('Failed to create school. Please try again.')
      setSaving(false)
      return
    }

    // Create admin's teacher record
    await supabase.from('teachers').insert({
      user_id: user.id,
      school_id: school.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
      email: user.email!,
    })

    setSchoolName(name.trim())
    setSchoolId(school.id)
    setSaving(false)
    setStep(2)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-cormorant text-3xl font-semibold text-espresso mb-2">
          Tell us about your school
        </h2>
        <p className="text-taupe">This information will appear on all timetables and shared links.</p>
      </div>

      <div className="space-y-6">
        <Input
          label="School name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Westbrook Academy"
          error={error ?? undefined}
          required
        />

        <div>
          <label className="text-sm font-medium text-espresso block mb-1.5">School logo (optional)</label>
          <div className="border-2 border-dashed border-sand rounded-xl px-6 py-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="cursor-pointer">
              <p className="text-sm text-taupe">
                {uploading ? 'Uploading...' : 'Click to upload a logo (PNG, JPG)'}
              </p>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} loading={saving} disabled={uploading}>
          Continue
        </Button>
      </div>
    </div>
  )
}
