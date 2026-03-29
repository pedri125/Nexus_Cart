import { cookies } from "next/headers"
import { adminAuth } from "./firebaseAdmin"

const SESSION_COOKIE_NAME = "nexuscart-token"
const ROLE_COOKIE_NAME = "nexuscart-role"
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 días

// Opcional: crear un Custom Token de Firebase a partir de un userId/role
export async function createToken(payload: { userId: string; role: string }) {
  return adminAuth.createCustomToken(payload.userId, { role: payload.role })
}

export async function verifyToken(token: string) {
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return {
      userId: decoded.uid,
      role: (decoded as any).role ?? "user",
    }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    return {
      userId: decoded.uid,
      role: (decoded as any).role ?? "user",
    }
  } catch {
    return null
  }
}

// Espera recibir un ID token de Firebase desde el cliente
export async function setSession(idToken: string, role?: string) {
  const expiresIn = SESSION_TTL_MS
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  })

  // Set a readable (non-httpOnly) role cookie for the middleware to check
  if (role) {
    cookieStore.set(ROLE_COOKIE_NAME, role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_MS / 1000,
      path: "/",
    })
  }
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  cookieStore.delete(ROLE_COOKIE_NAME)
}
