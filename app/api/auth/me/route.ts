import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebaseAdmin"
import { getSession } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ user: null })
    }

    await connectDB()
    const mongoUser = await User.findOne({ firebaseUid: session.userId }).lean()

    if (!mongoUser) {
      const authUser = await adminAuth.getUser(session.userId).catch(() => null)
      return NextResponse.json({
        user: {
          id: session.userId,
          name: authUser?.displayName ?? "",
          email: authUser?.email ?? "",
          role: session.role,
          createdAt: null,
        },
      })
    }

    const u = mongoUser as any
    return NextResponse.json({
      user: {
        id: session.userId,
        name: u.name ?? "",
        email: u.email ?? "",
        role: u.role ?? session.role,
        createdAt: u.createdAt ?? null,
        phone: u.phone,
        address: u.address,
        city: u.city,
        state: u.state,
        zipCode: u.zipCode,
        country: u.country,
      },
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
