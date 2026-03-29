import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Sale } from "@/lib/models/Sale"
import { Order } from "@/lib/models/Order"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const sale = await Sale.findById(id).lean()
  if (!sale) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  const s = sale as any
  return NextResponse.json({ ...s, _id: s._id.toString() })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await connectDB()
  const body = await request.json()
  const { status: newStatus } = body

  // Fetch current sale to check status
  const current = await Sale.findById(id)
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // F1 – Cancelled is a terminal state; no further transitions allowed
  if (current.status === "cancelled") {
    return NextResponse.json(
      { error: "Una venta cancelada no puede cambiar de estado." },
      { status: 400 }
    )
  }

  // Block reversal: once delivered, cannot be cancelled
  if (current.status === "delivered" && newStatus === "cancelled") {
    return NextResponse.json(
      { error: "Una venta ya entregada no puede cancelarse." },
      { status: 400 }
    )
  }

  const updated = await Sale.findByIdAndUpdate(id, { status: newStatus }, { new: true }).lean()
  const s = updated as any

  // F5 – Propagate status to linked Order so customer sees it in real time
  if (current.orderId) {
    await Order.findByIdAndUpdate(current.orderId, { status: newStatus }).catch(() => null)
  }

  return NextResponse.json({ ...s, _id: s._id.toString() })
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Las ventas no pueden eliminarse." },
    { status: 405 }
  )
}
