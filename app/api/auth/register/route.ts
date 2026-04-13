import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { setSession } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function POST(request: Request) {
  try {
    const { idToken, name } = await request.json()

    if (!idToken || !name) {
      return NextResponse.json(
        { error: "name e idToken son requeridos" },
        { status: 400 }
      )
    }

    const adminAuth = getAdminAuth()
    const decoded = await adminAuth.verifyIdToken(idToken)
    const uid = decoded.uid
    const email = decoded.email ?? ""

    await connectDB()
    await User.findOneAndUpdate(
      { firebaseUid: uid },
      { firebaseUid: uid, name, email, role: "customer" },
      { upsert: true, new: true }
    )

    await setSession(idToken)

    const user = {
      id: uid,
      name,
      email,
      role: "customer" as const,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    )
  }
}
