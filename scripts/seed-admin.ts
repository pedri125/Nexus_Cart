/**
 * Crea un usuario administrador en Firebase Auth y en MongoDB.
 * Uso: npx tsx scripts/seed-admin.ts
 * Credenciales por defecto: admin@nexuscart.com / Admin123!.
 */
import "dotenv/config"
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import mongoose from "mongoose"
import fs from "node:fs"
import path from "node:path"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@nexuscart.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin123!."
const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/nexuscart"

// ── Firebase Admin ─────────────────────────────────────────────────────────
function loadCred() {
  const cwd = process.cwd()
  const candidates = [
    path.join(cwd, "nexuscart-1254-firebase-adminsdk-fbsvc-7a1bde0337.json"),
    path.join(cwd, "firebase-service-account.json"),
  ]
  // also auto-detect any adminsdk json in root
  try {
    for (const f of fs.readdirSync(cwd)) {
      if (f.endsWith(".json") && (f.includes("firebase") || f.includes("adminsdk")))
        candidates.push(path.join(cwd, f))
    }
  } catch {}
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf8"))
      if (j.project_id && j.client_email && j.private_key)
        return cert({ projectId: j.project_id, clientEmail: j.client_email, privateKey: j.private_key })
    } catch {}
  }
  throw new Error("No se encontró el archivo de credenciales de Firebase Admin.")
}

const firebaseApp = getApps().length === 0 ? initializeApp({ credential: loadCred() }) : getApp()
const adminAuth = getAuth(firebaseApp)

// ── Mongoose User model (inline) ───────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    name:        { type: String, required: true },
    email:       { type: String, required: true },
    role:        { type: String, enum: ["customer", "admin", "employee"], default: "customer" },
    phone:       { type: String },
    address:     { type: String },
    city:        { type: String },
    state:       { type: String },
    zipCode:     { type: String },
    country:     { type: String },
  },
  { timestamps: true }
)
const User = mongoose.models.User ?? mongoose.model("User", UserSchema)

// ── Main ───────────────────────────────────────────────────────────────────
async function seedAdmin() {
  console.log("🔧 Conectando a MongoDB...")
  await mongoose.connect(MONGODB_URI)
  console.log("✅ MongoDB conectado")

  console.log(`\n👤 Creando usuario admin en Firebase Auth: ${ADMIN_EMAIL}`)
  let uid: string
  try {
    const record = await adminAuth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: "Administrador",
      emailVerified: true,
    })
    uid = record.uid
    console.log("✅ Usuario Firebase creado:", uid)
  } catch (err: any) {
    if (err?.code === "auth/email-already-exists") {
      const existing = await adminAuth.getUserByEmail(ADMIN_EMAIL)
      uid = existing.uid
      console.log("ℹ️  Email ya existe en Firebase. Usando uid:", uid)
    } else {
      throw err
    }
  }

  await adminAuth.setCustomUserClaims(uid, { role: "admin" })
  console.log("✅ Custom claim role=admin asignado en Firebase")

  const mongoUser = await User.findOneAndUpdate(
    { firebaseUid: uid },
    { firebaseUid: uid, name: "Administrador", email: ADMIN_EMAIL, role: "admin" },
    { upsert: true, new: true }
  )
  console.log("✅ Usuario admin guardado en MongoDB:", mongoUser._id.toString())

  console.log("\n🎉 ¡Listo! Inicia sesión con:")
  console.log("   Email:     ", ADMIN_EMAIL)
  console.log("   Contraseña:", ADMIN_PASSWORD)
  console.log("\n   Luego ve a http://localhost:3000/admin\n")

  await mongoose.disconnect()
  process.exit(0)
}

seedAdmin().catch((e) => {
  console.error("❌ Error:", e)
  process.exit(1)
})
