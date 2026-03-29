import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Supplier } from "@/lib/models/Supplier"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const supplier = await Supplier.findById(id).lean()
  if (!supplier) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  const s = supplier as any
  return NextResponse.json({ ...s, _id: s._id.toString() })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const body = await request.json()
  const updated = await Supplier.findByIdAndUpdate(id, body, { new: true }).lean()
  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  const s = updated as any
  return NextResponse.json({ ...s, _id: s._id.toString() })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const { isActive } = await request.json()
  const updated = await Supplier.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  ).lean()
  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  const s = updated as any
  return NextResponse.json({ ...s, _id: s._id.toString() })
}

// DELETE is disabled – suppliers cannot be deleted, only deactivated
export async function DELETE() {
  return NextResponse.json(
    { error: "Los proveedores no pueden eliminarse. Usa desactivar." },
    { status: 405 }
  )
}
