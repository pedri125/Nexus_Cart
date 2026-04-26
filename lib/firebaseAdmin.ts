import { getApps, initializeApp, cert, getApp, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanPrivateKey(raw?: string) {
  if (!raw) return undefined
  const unquoted = raw.replace(/^['"]|['"]$/g, "")
  return unquoted.replace(/\\n/g, "\n")
}

// ---------------------------------------------------------------------------
// Lazy singleton — Firebase Admin is only initialized when the first request
// actually needs it, NOT at module-import / build time.
// ---------------------------------------------------------------------------

let _app: App | null = null
let _auth: Auth | null = null

function getOrInitApp(): App {
  if (_app) return _app

  // If another module already initialized the default app, reuse it
  if (getApps().length > 0) {
    _app = getApp()
    return _app
  }

  // --- Build credential ---

  // 1. Full JSON from FIREBASE_SERVICE_ACCOUNT_KEY
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (serviceAccountRaw) {
    try {
      const sa = JSON.parse(serviceAccountRaw)
      _app = initializeApp({ credential: cert(sa) })
      return _app
    } catch (error) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error)
    }
  }

  // 2. Individual env vars
  const privateKey = cleanPrivateKey(process.env.FIREBASE_PRIVATE_KEY)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    _app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })
    return _app
  }

  throw new Error(
    "Firebase Admin: no credentials found. " +
    "Set FIREBASE_SERVICE_ACCOUNT_KEY (full JSON) or individual FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars."
  )
}

/**
 * Returns the Firebase Admin Auth instance, initializing the app lazily on
 * first call. Safe to import at module level — no work is done until you
 * actually call this function at request time.
 */
export function getAdminAuth(): Auth {
  if (_auth) return _auth
  _auth = getAuth(getOrInitApp())
  return _auth
}
