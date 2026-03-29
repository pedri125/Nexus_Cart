import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { Order } from "@/lib/models/Order"
import { Sale } from "@/lib/models/Sale"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()
    const doc = await Order.findById(id).lean()

    if (!doc) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    const d = doc as any
    if (d.userId !== session.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const order = {
      id: d._id.toString(),
      userId: d.userId,
      userEmail: d.userEmail,
      userName: d.userName ?? "",
      items: d.items ?? [],
      subtotal: d.subtotal ?? 0,
      shipping: d.shipping ?? 0,
      tax: d.tax ?? 0,
      total: d.total ?? 0,
      status: d.status ?? "pending",
      paymentMethod: d.paymentMethod ?? "card",
      shippingAddress: d.shippingAddress ?? {},
      createdAt: d.createdAt?.toISOString?.() ?? new Date().toISOString(),
    }

    return NextResponse.json({ order })
  } catch (e) {
    console.error("GET /api/orders/[id]", e)
    return NextResponse.json({ error: "Error al obtener el pedido" }, { status: 500 })
  }
}

/** PATCH: user cancels their own order (only when status is 'pending') */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const order = await Order.findById(id)
    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    // Ownership check
    if ((order as any).userId !== session.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Only cancellable if still 'pending'
    if ((order as any).status !== "pending") {
      return NextResponse.json(
        { error: "Solo puedes cancelar un pedido que aún esté pendiente. Si ya fue enviado no es posible cancelarlo." },
        { status: 400 }
      )
    }

    // Cancel the order
    order.set("status", "cancelled")
    await order.save()

    // Also cancel the linked Sale record
    await Sale.updateOne({ orderId: id }, { status: "cancelled" })

    return NextResponse.json({ success: true, status: "cancelled" })
  } catch (e) {
    console.error("PATCH /api/orders/[id]", e)
    return NextResponse.json({ error: "Error al cancelar el pedido" }, { status: 500 })
  }
}
