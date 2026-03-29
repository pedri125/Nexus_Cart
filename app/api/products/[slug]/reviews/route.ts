import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { Product } from "@/lib/models/Product"
import { ReviewModel } from "@/lib/models/Review"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    await connectDB()

    const product = await Product.findOne({ slug }).lean()
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const reviews = await ReviewModel.find({ productId: (product as any)._id })
      .sort({ createdAt: -1 })
      .lean()

    const mapped = (reviews as any[]).map((r) => ({
      id: r._id.toString(),
      productId: r.productId,
      userId: r.userId,
      userName: r.userName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }))

    return NextResponse.json({ reviews: mapped })
  } catch (error) {
    console.error("GET /api/products/[slug]/reviews error:", error)
    return NextResponse.json({ error: "Error al cargar comentarios" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()

    if (!body.rating || !body.comment || typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "Datos de reseña inválidos" }, { status: 400 })
    }

    await connectDB()
    const product = await Product.findOne({ slug })
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const productId = (product as any)._id.toString()

    // Comprobar si el usuario ya comentó
    const existing = await ReviewModel.findOne({ productId, userId: session.userId })
    if (existing) {
      return NextResponse.json({ error: "Ya has dejado una reseña para este producto" }, { status: 400 })
    }

    // Attempt to extract the name or default to the email portion
    let nameToUse = "Usuario"
    if (session.userEmail) {
       nameToUse = session.userEmail.split('@')[0]
    }

    const newReview = await ReviewModel.create({
      productId,
      userId: session.userId,
      userName: nameToUse,
      rating: body.rating,
      comment: body.comment,
    })

    // Actualizar producto
    const currentCount = (product as any).reviewCount || 0
    const currentRating = (product as any).rating || 0
    
    const newCount = currentCount + 1
    const newRating = ((currentRating * currentCount) + body.rating) / newCount

    product.set("reviewCount", newCount)
    product.set("rating", Number(newRating.toFixed(1)))
    await product.save()

    return NextResponse.json({
      success: true,
      review: {
        id: newReview._id.toString(),
        productId: newReview.productId,
        userId: newReview.userId,
        userName: newReview.userName,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: newReview.createdAt.toISOString(),
      }
    })
  } catch (error) {
    console.error("POST /api/products/[slug]/reviews error:", error)
    return NextResponse.json({ error: "Error al crear reseña" }, { status: 500 })
  }
}
