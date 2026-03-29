import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Supplier } from "@/lib/models/Supplier"

export async function GET(request: Request) {
  await connectDB()
  const { searchParams } = new URL(request.url)
  const all = searchParams.get("all") === "1"
  const query = all ? {} : { isActive: { $ne: false } }
  const suppliers = await Supplier.find(query).sort({ createdAt: -1 }).lean()
  const normalized = (suppliers as any[]).map((s) => ({ ...s, _id: s._id.toString() }))
  return NextResponse.json(normalized)
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const supplier = new Supplier({ ...body, isActive: true })
    await supplier.save()
    const obj = supplier.toObject()
    return NextResponse.json({ ...obj, _id: obj._id.toString() }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
