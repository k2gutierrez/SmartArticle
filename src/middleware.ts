import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: Esto refresca la sesión si ha expirado
  const { data: { user } } = await supabase.auth.getUser()

  const protectedRoutes = ['/editor', '/profile', '/train', '/dashboard']
  const isProtectedRoute = protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path))

  // Redirecciones de seguridad
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/editor', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Excluimos estáticos pero incluimos TODAS las rutas de API
     * para que el token se refresque antes de llegar a la IA.
     */
    '/((?!_next/static|_next/image|favicon.ico|perfil|auth/callback).*)',
  ],
}