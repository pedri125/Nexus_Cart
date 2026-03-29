import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Product } from "@/lib/models/Product"
import { PRODUCTS_DATA } from "@/lib/products-data"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    await connectDB()
    const product = await Product.findOne({ slug }).lean()

    if (product) {
      const p = product as any
      return NextResponse.json({ ...p, id: p._id.toString() })
    }

    // Fallback: try static data
    const staticProduct = PRODUCTS_DATA.find((p) => p.slug === slug)
    if (staticProduct) {
      return NextResponse.json(staticProduct)
    }

    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  } catch {
    // DB error – try static fallback
    const staticProduct = PRODUCTS_DATA.find((p) => p.slug === slug)
    if (staticProduct) {
      return NextResponse.json(staticProduct)
    }
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  }
}
