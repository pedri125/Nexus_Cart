import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const SESSION_COOKIE = "nexuscart-token"
const ROLE_COOKIE = "nexuscart-role"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
  const roleCookie = request.cookies.get(ROLE_COOKIE)?.value

  // No session → redirect to home
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Session exists but role is not admin → redirect to home
  if (roleCookie !== "admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
