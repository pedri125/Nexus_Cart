import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { User } from "@/lib/models/User"

/** GET: obtener perfil del usuario (datos extendidos desde users) */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await connectDB()
    const mongoUser = await User.findOne({ firebaseUid: session.userId }).lean()
    const data = (mongoUser as any) ?? {}

    return NextResponse.json({
      profile: {
        name: data.name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        zipCode: data.zipCode ?? "",
        country: data.country ?? "",
      },
    })
  } catch (e) {
    console.error("GET /api/user/profile", e)
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 })
  }
}

/** PATCH: actualizar perfil (gestión de cuenta) */
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, address, city, state, zipCode, country } = body as {
      name?: string
      phone?: string
      address?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
    }

    await connectDB()
    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (phone !== undefined) updates.phone = phone
    if (address !== undefined) updates.address = address
    if (city !== undefined) updates.city = city
    if (state !== undefined) updates.state = state
    if (zipCode !== undefined) updates.zipCode = zipCode
    if (country !== undefined) updates.country = country

    const updated = await User.findOneAndUpdate(
      { firebaseUid: session.userId },
      { $set: updates },
      { new: true, upsert: true }
    ).lean()

    const data = (updated as any) ?? {}
    return NextResponse.json({
      profile: {
        name: data.name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        zipCode: data.zipCode ?? "",
        country: data.country ?? "",
      },
    })
  } catch (e) {
    console.error("PATCH /api/user/profile", e)
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 })
  }
}
