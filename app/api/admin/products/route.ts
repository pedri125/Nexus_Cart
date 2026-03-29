import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Product } from "@/lib/models/Product"

export async function GET(request: Request) {
  await connectDB()
  const { searchParams } = new URL(request.url)
  const all = searchParams.get("all") === "1"
  const query = all ? {} : { isActive: { $ne: false } }
  const products = await Product.find(query).sort({ createdAt: -1 }).lean()
  const normalized = (products as any[]).map((p) => ({ ...p, id: p._id.toString() }))
  return NextResponse.json(normalized)
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    // Never allow stock to be set manually via API – only via purchases
    const { stock: _stock, isActive: _ia, ...safeBody } = body
    const product = new Product({ ...safeBody, stock: 0, isActive: true })
    await product.save()
    return NextResponse.json({ ...product.toObject(), id: product._id.toString() }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
