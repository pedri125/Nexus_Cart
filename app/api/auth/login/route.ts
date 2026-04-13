import { NextResponse } from "next/server"
import { getAdminAuth } from "@/lib/firebaseAdmin"
import { setSession } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json(
        { error: "El idToken de Firebase es requerido" },
        { status: 400 }
      )
    }

    const adminAuth = getAdminAuth()
    const decoded = await adminAuth.verifyIdToken(idToken)

    // Get role from MongoDB (source of truth)
    let role = (decoded as any).role ?? "customer"
    try {
      await connectDB()
      const mongoUser = await User.findOne({ firebaseUid: decoded.uid }).lean()
      if (mongoUser) {
        role = (mongoUser as any).role ?? role
      }
    } catch {
      // fallback to decoded role
    }

    await setSession(idToken, role)

    const user = {
      id: decoded.uid,
      email: decoded.email ?? "",
      name: decoded.name ?? "",
      role,
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Error al iniciar sesion" },
      { status: 500 }
    )
  }
}
