import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role as string | undefined
  const { pathname } = request.nextUrl

  if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/teacher'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && role === 'teacher' && pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/teacher/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && role === 'admin' && pathname.startsWith('/teacher')) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/timetable'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
