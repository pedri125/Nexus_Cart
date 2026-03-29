import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Purchase } from "@/lib/models/Purchase"

export async function GET() {
  await connectDB()
  const purchases = await Purchase.find({}).sort({ createdAt: -1 }).lean()
  const normalized = (purchases as any[]).map((p) => ({ ...p, _id: p._id.toString(), supplierId: p.supplierId?.toString() }))
  return NextResponse.json(normalized)
}

export async function POST(request: Request) {
  try {
    await connectDB()
    const body = await request.json()
    const purchase = new Purchase(body)
    await purchase.save()
    const obj = purchase.toObject()
    return NextResponse.json({ ...obj, _id: obj._id.toString() }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
