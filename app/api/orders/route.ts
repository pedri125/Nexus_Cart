import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { Order } from "@/lib/models/Order"
import { Sale } from "@/lib/models/Sale"
import type { OrderItem, ShippingAddress, PaymentMethod } from "@/lib/types"

/** GET: listar pedidos del usuario autenticado */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await connectDB()
    const docs = await Order.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const orders = (docs as any[]).map((d) => ({
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
    }))

    return NextResponse.json({ orders })
  } catch (e) {
    console.error("GET /api/orders", e)
    return NextResponse.json({ error: "Error al listar pedidos" }, { status: 500 })
  }
}

/** POST: crear pedido (checkout) + auto-generar venta */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      items,
      subtotal,
      shipping,
      tax,
      total,
      paymentMethod,
      shippingAddress,
      userName,
      userEmail,
    } = body as {
      items: OrderItem[]
      subtotal: number
      shipping: number
      tax: number
      total: number
      paymentMethod: PaymentMethod
      shippingAddress: ShippingAddress
      userName: string
      userEmail: string
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      typeof total !== "number" ||
      !shippingAddress?.fullName ||
      !shippingAddress?.address ||
      !shippingAddress?.city ||
      !shippingAddress?.country ||
      !shippingAddress?.phone
    ) {
      return NextResponse.json({ error: "Datos del pedido incompletos" }, { status: 400 })
    }

    await connectDB()

    // 1. Create the Order
    const order = await Order.create({
      userId: session.userId,
      userEmail: userEmail || session.userId,
      userName: userName || "",
      items,
      subtotal: subtotal ?? 0,
      shipping: shipping ?? 0,
      tax: tax ?? 0,
      total,
      status: "pending",
      paymentMethod: paymentMethod ?? "card",
      shippingAddress,
    })

    // 2. Auto-create corresponding Sale record
    const saleItems = items.map((it: any) => ({
      productId: it.productId,
      name: it.name,
      quantity: it.quantity,
      unitPrice: it.price,
    }))

    await Sale.create({
      orderId: order._id.toString(),
      userId: session.userId,
      userEmail: userEmail || session.userId,
      items: saleItems,
      subtotal: subtotal ?? 0,
      tax: tax ?? 0,
      total,
      status: "pending",
      paymentMethod: paymentMethod ?? "card",
    })

    return NextResponse.json({
      orderId: order._id.toString(),
      order: {
        id: order._id.toString(),
        ...order.toObject(),
        createdAt: order.createdAt.toISOString(),
      },
    })
  } catch (e) {
    console.error("POST /api/orders", e)
    return NextResponse.json({ error: "Error al crear el pedido" }, { status: 500 })
  }
}
