// Layout for the setup section — the wizard (/admin/setup) has its own full-screen layout,
// while sub-pages (/admin/setup/teachers, /admin/setup/rooms, /admin/setup/subjects)
// use the main AppLayout injected by their own page.tsx files.
// This file just passes children through to avoid double-wrapping.

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
