'use client'

import { Search, BookOpen, Users, Layout, DoorOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SearchResult {
  id: string
  label: string
  sublabel?: string
  category: 'teachers' | 'sections' | 'subjects' | 'rooms'
  href: string
}

const categoryIcons = {
  teachers: <Users className="h-4 w-4" />,
  sections: <Layout className="h-4 w-4" />,
  subjects: <BookOpen className="h-4 w-4" />,
  rooms: <DoorOpen className="h-4 w-4" />,
}

const categoryLabels = {
  teachers: 'Teachers',
  sections: 'Sections',
  subjects: 'Subjects',
  rooms: 'Rooms',
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      const [teachers, subjects, rooms] = await Promise.all([
        supabase
          .from('teachers')
          .select('id, name, email')
          .ilike('name', `%${query}%`)
          .limit(4),
        supabase
          .from('subjects')
          .select('id, name, type')
          .ilike('name', `%${query}%`)
          .limit(4),
        supabase
          .from('rooms')
          .select('id, name, type')
          .ilike('name', `%${query}%`)
          .limit(4),
      ])

      const allResults: SearchResult[] = [
        ...(teachers.data || []).map((t) => ({
          id: t.id,
          label: t.name,
          sublabel: t.email,
          category: 'teachers' as const,
          href: '/admin/setup/teachers',
        })),
        ...(subjects.data || []).map((s) => ({
          id: s.id,
          label: s.name,
          sublabel: s.type,
          category: 'subjects' as const,
          href: '/admin/setup/subjects',
        })),
        ...(rooms.data || []).map((r) => ({
          id: r.id,
          label: r.name,
          sublabel: r.type,
          category: 'rooms' as const,
          href: '/admin/setup/rooms',
        })),
      ]

      setResults(allResults)
      setSelected(0)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, supabase])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter' && results[selected]) {
        router.push(results[selected].href)
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, results, selected, router, onClose])

  if (!open) return null

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-espresso/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-ivory rounded-2xl border border-sand shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-sand">
          <Search className="h-4 w-4 text-taupe flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teachers, subjects, rooms..."
            className="flex-1 bg-transparent text-sm text-espresso placeholder:text-taupe outline-none"
          />
          <kbd className="text-xs text-taupe bg-cream border border-sand rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {Object.keys(grouped).length > 0 && (
          <div className="py-2 max-h-96 overflow-y-auto">
            {(Object.entries(grouped) as [string, SearchResult[]][]).map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-2 px-4 py-2">
                  <span className="text-taupe">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                  <span className="text-xs font-medium text-taupe uppercase tracking-wide">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </span>
                </div>
                {items.map((item, idx) => {
                  const globalIdx = results.indexOf(item)
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setSelected(globalIdx)}
                      onClick={() => { router.push(item.href); onClose() }}
                      className={`w-full text-left px-4 py-2.5 flex flex-col transition-colors ${
                        selected === globalIdx ? 'bg-cream' : 'hover:bg-cream/50'
                      }`}
                    >
                      <span className="text-sm text-espresso font-medium">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-xs text-taupe">{item.sublabel}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-taupe">
            No results for &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  )
}
