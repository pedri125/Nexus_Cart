import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Sale } from "@/lib/models/Sale"

export async function GET() {
  await connectDB()
  const sales = await Sale.find({}).sort({ createdAt: -1 }).lean()
  const normalized = (sales as any[]).map((s) => ({ ...s, _id: s._id.toString() }))
  return NextResponse.json(normalized)
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const sale = new Sale(body)
    await sale.save()
    const obj = sale.toObject()
    return NextResponse.json({ ...obj, _id: obj._id.toString() }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
