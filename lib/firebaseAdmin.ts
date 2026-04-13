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
  // 1. Intentar cargar desde el JSON completo que pegaste en Vercel
  // Esta es la variable de tu captura de pantalla
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountRaw) {
    try {
      // Si el JSON viene con saltos de línea literales (\n), los limpiamos
      const serviceAccount = JSON.parse(serviceAccountRaw);
      return cert(serviceAccount);
    } catch (error) {
      console.error("Error parseando FIREBASE_SERVICE_ACCOUNT_KEY:", error);
    }
  }

  // 2. Fallback: Intentar cargar desde variables individuales (si las llegas a poner)
  const privateKey = cleanPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    });
  }

  // 3. Durante el Build de Vercel, si no hay credenciales, devolvemos null en vez de romper
  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️ Firebase Admin no configurado. Ignorando durante el build...");
    return undefined;
  }

  throw new Error("Faltan credenciales de Firebase Admin.");
}

const app =
  getApps().length === 0
    ? initializeApp({
      credential: buildCredential(),
    })
    : getApp()

export const adminAuth = getAuth(app)
