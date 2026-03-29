import { getApps, initializeApp, cert, getApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import fs from "node:fs"
import path from "node:path"

function cleanPrivateKey(raw?: string) {
  if (!raw) return undefined
  // .env.local en Windows a veces deja comillas al inicio/fin
  const unquoted = raw.replace(/^['"]|['"]$/g, "")
  return unquoted.replace(/\\n/g, "\n")
}

function loadServiceAccountFromFile(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const cwd = process.cwd()
  const fromEnvPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()
  const candidatePaths: string[] = [
    fromEnvPath,
    path.join(cwd, "firebase-service-account.json"),
    path.join(cwd, "nexuscart-1254-firebase-adminsdk-fbsvc-7a1bde0337.json"),
  ].filter(Boolean) as string[]

  // Buscar también cualquier *firebase*adminsdk*.json en la raíz
  try {
    const files = fs.readdirSync(cwd)
    const jsonCandidates = files.filter(
      (f) => f.endsWith(".json") && (f.includes("firebase") || f.includes("adminsdk"))
    )
    for (const f of jsonCandidates) {
      candidatePaths.push(path.join(cwd, f))
    }
  } catch {
    // ignore
  }

  for (const p of candidatePaths) {
    try {
      const fullPath = path.isAbsolute(p) ? p : path.join(cwd, p)
      if (!fs.existsSync(fullPath)) continue
      const json = JSON.parse(fs.readFileSync(fullPath, "utf8"))
      if (json.project_id && json.client_email && json.private_key) {
        return {
          projectId: json.project_id,
          clientEmail: json.client_email,
          privateKey: json.private_key,
        }
      }
    } catch {
      // sigue con el siguiente
    }
  }

  return null
}

function buildCredential() {
  // 1) Prioridad: archivo JSON (evita problemas con FIREBASE_PRIVATE_KEY en .env)
  const fromFile = loadServiceAccountFromFile()
  if (fromFile) return cert(fromFile)

  // 2) Variables de entorno
  const fromEnv = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: cleanPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  }

  const hasValidPem =
    fromEnv.privateKey?.includes("-----BEGIN PRIVATE KEY-----") &&
    fromEnv.privateKey?.includes("-----END PRIVATE KEY-----")

  if (fromEnv.projectId && fromEnv.clientEmail && hasValidPem) {
    try {
      return cert(fromEnv)
    } catch {
      // fall through to error
    }
  }

  throw new Error(
    "Firebase Admin: configura credential con FIREBASE_SERVICE_ACCOUNT_PATH o coloca el JSON de cuenta de servicio en la raíz (ej. firebase-service-account.json o nexuscart-*-firebase-adminsdk-*.json)"
  )
}

const app =
  getApps().length === 0
    ? initializeApp({
        credential: buildCredential(),
      })
    : getApp()

export const adminAuth = getAuth(app)
