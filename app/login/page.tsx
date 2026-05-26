'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signIn } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await signIn(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex w-1/2 bg-champagne relative overflow-hidden flex-col justify-center items-center p-16">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #B8A898 0px,
              #B8A898 1px,
              transparent 0,
              transparent 50%
            )`,
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative text-center">
          <div className="h-16 w-16 rounded-2xl bg-mocha flex items-center justify-center mx-auto mb-8">
            <span className="text-ivory text-3xl font-bold font-cormorant">T</span>
          </div>
          <h1 className="text-5xl font-cormorant font-semibold text-espresso mb-4">Tablo</h1>
          <p className="text-clay text-lg leading-relaxed max-w-xs">
            Beautiful school timetable management, thoughtfully designed.
          </p>
        </div>
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-mocha/30"
            />
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10 text-center">
            <div className="h-12 w-12 rounded-xl bg-mocha flex items-center justify-center mx-auto mb-4">
              <span className="text-ivory text-2xl font-bold font-cormorant">T</span>
            </div>
            <h1 className="text-3xl font-cormorant font-semibold text-espresso">Tablo</h1>
          </div>

          <h2 className="text-3xl font-cormorant font-semibold text-espresso mb-2">Welcome back</h2>
          <p className="text-taupe text-sm mb-8">Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="email"
              label="Email"
              type="email"
              placeholder="you@school.edu"
              autoComplete="email"
              required
            />
            <Input
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
