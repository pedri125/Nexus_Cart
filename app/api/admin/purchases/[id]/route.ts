import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Purchase } from "@/lib/models/Purchase"
import { Product } from "@/lib/models/Product"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const purchase = await Purchase.findById(id).lean()
  if (!purchase) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  const p = purchase as any
  return NextResponse.json({ ...p, _id: p._id.toString() })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const body = await request.json()
  const { status: newStatus } = body

  // Fetch the current purchase to check current status
  const current = await Purchase.findById(id)
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // F1 – Cancelled is a terminal state; no further transitions allowed
  if (current.status === "cancelled") {
    return NextResponse.json(
      { error: "Una compra cancelada no puede cambiar de estado." },
      { status: 400 }
    )
  }

  // Block reversal: once received, cannot be cancelled
  if (current.status === "received" && newStatus === "cancelled") {
    return NextResponse.json(
      { error: "Una compra ya recibida no puede cancelarse." },
      { status: 400 }
    )
  }

  // When transitioning to received, update product stock
  if (newStatus === "received" && current.status !== "received") {
    for (const item of current.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        })
      }
    }
  }

  const updated = await Purchase.findByIdAndUpdate(id, { status: newStatus }, { new: true }).lean()
  const p = updated as any
  return NextResponse.json({ ...p, _id: p._id.toString() })
}

// DELETE is disabled – purchases cannot be deleted
export async function DELETE() {
  return NextResponse.json(
    { error: "Las compras no pueden eliminarse." },
    { status: 405 }
  )
}
