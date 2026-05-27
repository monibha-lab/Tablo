'use client'

import { useState } from 'react'
import { useWizardStore } from '@/lib/store/wizard-store'
import { Step1School } from './steps/Step1School'
import { Step2Bell } from './steps/Step2Bell'
import { Step3Rooms } from './steps/Step3Rooms'
import { Step4Teachers } from './steps/Step4Teachers'
import { Step5Grades } from './steps/Step5Grades'
import { Step6Review } from './steps/Step6Review'

const STEPS = [
  { label: 'School', short: '01' },
  { label: 'Bell',   short: '02' },
  { label: 'Rooms',  short: '03' },
  { label: 'Staff',  short: '04' },
  { label: 'Grades', short: '05' },
  { label: 'Review', short: '06' },
]

const mono:  React.CSSProperties = { fontFamily: 'var(--font-mono)' }
const serif: React.CSSProperties = { fontFamily: 'var(--font-serif)', fontStyle: 'italic' }

export default function SetupPage() {
  const { step } = useWizardStore()

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-brand-linen)', color: 'var(--color-brand-mocha)' }}
    >
      {/* ── Progress header ──────────────────────────── */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--color-brand-linen)', borderColor: 'var(--color-brand-sand)' }}
      >
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl" style={{ ...serif, color: 'var(--color-brand-mocha)' }}>
                Setup Wizard
              </h1>
              <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ ...mono, color: 'var(--color-brand-taupe)' }}>
                Step {step} of {STEPS.length}
              </p>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const idx = i + 1
              const past    = idx < step
              const current = idx === step
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full h-[3px] rounded-full transition-all"
                    style={{
                      backgroundColor: past
                        ? 'var(--color-brand-mocha)'
                        : current
                        ? 'rgba(60,53,48,0.4)'
                        : 'var(--color-brand-sand)',
                    }}
                  />
                  <span
                    className="hidden sm:block text-[9px] uppercase tracking-widest"
                    style={{
                      ...mono,
                      color: current
                        ? 'var(--color-brand-mocha)'
                        : past
                        ? 'var(--color-brand-taupe)'
                        : 'var(--color-brand-sand)',
                      fontWeight: current ? 700 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Step content ─────────────────────────────── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        {step === 1 && <Step1School />}
        {step === 2 && <Step2Bell />}
        {step === 3 && <Step3Rooms />}
        {step === 4 && <Step4Teachers />}
        {step === 5 && <Step5Grades />}
        {step === 6 && <Step6Review />}
      </div>
    </div>
  )
}
