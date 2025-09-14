import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/auth/callback",
    "/auth/verify",
    "/auth/verify-error",
    "/auth/verify-success",
    "/artists", // Allow browsing artists without auth
  ]

  // Check if the path is public
  const isPublicPath = publicPaths.some((publicPath) => {
    if (publicPath === "/") {
      return path === "/"
    }
    return path.startsWith(publicPath)
  })

  // If it's a public path, allow the request to continue
  if (isPublicPath) {
    return NextResponse.next()
  }

  // For protected paths, check for session cookie
  const sessionCookie = request.cookies.get("sb-access-token")

  // If no session cookie, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirectTo", path)
    return NextResponse.redirect(loginUrl)
  }

  // Allow the request to continue
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
