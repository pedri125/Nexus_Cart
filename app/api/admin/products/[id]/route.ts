import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Product } from "@/lib/models/Product"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const product = await Product.findById(id).lean()
  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  const p = product as any
  return NextResponse.json({ ...p, id: p._id.toString() })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const body = await request.json()
  // Strip stock and isActive so they cannot be manually changed via PUT
  const { stock: _stock, isActive: _ia, ...safeBody } = body
  const updated = await Product.findByIdAndUpdate(id, safeBody, { new: true }).lean()
  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  const p = updated as any
  return NextResponse.json({ ...p, id: p._id.toString() })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const { isActive } = await request.json()
  const updated = await Product.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  ).lean()
  if (!updated) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  const p = updated as any
  return NextResponse.json({ ...p, id: p._id.toString() })
}

// DELETE is disabled – products cannot be deleted, only deactivated
export async function DELETE() {
  return NextResponse.json(
    { error: "Los productos no pueden eliminarse. Usa desactivar." },
    { status: 405 }
  )
}
