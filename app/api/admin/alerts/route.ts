import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Product } from "@/lib/models/Product"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const threshold = Number(searchParams.get("threshold") ?? "10")

  await connectDB()
  const products = await Product.find({ stock: { $lte: threshold } })
    .select("name slug stock category brand")
    .sort({ stock: 1 })
    .lean()

  const normalized = (products as any[]).map((p) => ({ ...p, _id: p._id.toString() }))
  return NextResponse.json({ alerts: normalized, threshold })
}
