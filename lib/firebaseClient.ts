import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim()
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()

if (typeof window !== "undefined" && (!apiKey || !authDomain || !projectId)) {
  console.warn(
    "[Firebase] Faltan variables de entorno. Añade NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN y NEXT_PUBLIC_FIREBASE_PROJECT_ID en .env.local"
  )
}

const firebaseConfig = {
  apiKey: apiKey || "",
  authDomain: authDomain || "",
  projectId: projectId || "",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const firebaseAuth = getAuth(app)

