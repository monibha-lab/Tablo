'use client'

import { useState } from 'react'
import { signIn } from '@/app/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await signIn(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--color-brand-linen)', color: 'var(--color-brand-mocha)' }}
    >
      {/* ── Left decorative panel ───────────────────────── */}
      <div
        className="hidden lg:flex w-5/12 flex-col justify-center items-center p-16 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-brand-cream)', borderRight: '0.5px solid var(--color-brand-sand)' }}
      >
        {/* subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg, transparent, transparent 39px,
              rgba(60,53,48,0.04) 39px, rgba(60,53,48,0.04) 40px
            ), repeating-linear-gradient(
              90deg, transparent, transparent 39px,
              rgba(60,53,48,0.04) 39px, rgba(60,53,48,0.04) 40px
            )`,
          }}
        />

        <div className="relative text-center">
          {/* Logo mark */}
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-8 text-2xl"
            style={{
              backgroundColor: 'var(--color-brand-mocha)',
              color: 'var(--color-brand-linen)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
            }}
          >
            T
          </div>

          <h1
            className="text-5xl font-bold tracking-widest uppercase mb-2"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-brand-mocha)' }}
          >
            Tablo
          </h1>
          <p
            className="text-[11px] uppercase tracking-widest mb-8"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-taupe)' }}
          >
            SchoolGrid System
          </p>

          <p
            className="text-base leading-relaxed max-w-xs mx-auto"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-brand-taupe)' }}
          >
            Beautiful school timetable management,
            <br />thoughtfully designed.
          </p>
        </div>

        {/* Bottom dots */}
        <div className="absolute bottom-10 flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: i === 2 ? 'var(--color-brand-mocha)' : 'var(--color-brand-sand)' }}
            />
          ))}
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-editorial-fade">

          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl"
              style={{
                backgroundColor: 'var(--color-brand-mocha)',
                color: 'var(--color-brand-linen)',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
              }}
            >
              T
            </div>
            <h1
              className="text-3xl font-bold tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
            >
              Tablo
            </h1>
          </div>

          <h2
            className="text-3xl mb-1"
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-brand-mocha)' }}
          >
            Welcome back
          </h2>
          <p
            className="text-sm mb-8"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-taupe)', letterSpacing: '0.04em' }}
          >
            Sign in to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-[10px] uppercase tracking-widest mb-1.5"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-taupe)' }}
              >
                Username or Email
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="e.g. john.smith"
                autoComplete="username"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-brand-cream)',
                  border: '0.5px solid var(--color-brand-sand)',
                  color: 'var(--color-brand-mocha)',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-taupe)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-brand-sand)')}
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-[10px] uppercase tracking-widest mb-1.5"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brand-taupe)' }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: 'var(--color-brand-cream)',
                  border: '0.5px solid var(--color-brand-sand)',
                  color: 'var(--color-brand-mocha)',
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-brand-taupe)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-brand-sand)')}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: 'rgba(182,109,109,0.08)',
                  border: '0.5px solid rgba(182,109,109,0.3)',
                  color: 'var(--color-brand-error)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-opacity mt-2 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-brand-mocha)',
                color: 'var(--color-brand-linen)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
