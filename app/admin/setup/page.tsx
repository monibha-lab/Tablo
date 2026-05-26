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
  'School Profile',
  'Bell Schedule',
  'Rooms',
  'Teachers',
  'Grades & Sections',
  'Review',
]

export default function SetupPage() {
  const { step } = useWizardStore()

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <div className="border-b border-sand/40 bg-ivory sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-cormorant text-2xl font-semibold text-espresso">School Setup</h1>
            <span className="text-sm text-taupe">Step {step} of {STEPS.length}</span>
          </div>
          <div className="flex gap-2">
            {STEPS.map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-colors ${
                    i + 1 < step
                      ? 'bg-mocha'
                      : i + 1 === step
                      ? 'bg-mocha/60'
                      : 'bg-sand'
                  }`}
                />
                <span className="text-[10px] text-taupe hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
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
