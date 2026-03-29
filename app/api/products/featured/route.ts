import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Product } from "@/lib/models/Product"
import { PRODUCTS_DATA } from "@/lib/products-data"

export async function GET() {
  try {
    await connectDB()
    const featured = await Product.find({ featured: true }).lean()

    if (featured.length === 0) {
      // Fallback to static featured products
      const staticFeatured = PRODUCTS_DATA.filter((p) => p.featured)
      return NextResponse.json(staticFeatured)
    }

    const normalized = (featured as any[]).map((p) => ({ ...p, id: p._id.toString() }))
    return NextResponse.json(normalized)
  } catch {
    const staticFeatured = PRODUCTS_DATA.filter((p) => p.featured)
    return NextResponse.json(staticFeatured)
  }
}
