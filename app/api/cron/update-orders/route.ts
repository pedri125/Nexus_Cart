import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Order } from "@/lib/models/Order"
import { Sale } from "@/lib/models/Sale"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Protección opcional con CRON_SECRET
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await connectDB()

    // Buscamos órdenes que no estén canceladas ni entregadas
    const activeOrders = await Order.find({
      status: { $nin: ["cancelled", "delivered"] },
    })

    const now = Date.now()
    const updates = []

    for (const order of activeOrders) {
      const ageInMs = now - new Date(order.createdAt).getTime()
      const ageInHours = ageInMs / (1000 * 60 * 60)

      let targetStatus = order.status

      if (ageInHours >= 48) {
        targetStatus = "delivered"
      } else if (ageInHours >= 24) {
        if (order.status === "pending" || order.status === "processing") {
          targetStatus = "shipped"
        }
      } else if (ageInHours >= 12) {
        if (order.status === "pending") {
          targetStatus = "processing"
        }
      }

      if (targetStatus !== order.status) {
        order.status = targetStatus
        updates.push(order.save())
        
        // Actualizar la venta asociada
        updates.push(
          Sale.updateOne(
            { orderId: order._id.toString() },
            { $set: { status: targetStatus } }
          )
        )
      }
    }

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: `Procesadas ${activeOrders.length} órdenes. Actualizadas: ${updates.length / 2}`
    })
  } catch (error) {
    console.error("Cron update orders error:", error)
    return NextResponse.json({ error: "Error al actualizar pedidos" }, { status: 500 })
  }
}
