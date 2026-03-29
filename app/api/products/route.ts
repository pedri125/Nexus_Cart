import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import { Product } from "@/lib/models/Product"
import { PRODUCTS_DATA } from "@/lib/products-data"
import type { ProductFilters } from "@/lib/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const filters: ProductFilters = {
    category: searchParams.get("category") || undefined,
    brand: searchParams.get("brand") || undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
    search: searchParams.get("search") || undefined,
    sort: (searchParams.get("sort") as ProductFilters["sort"]) || "relevance",
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 12,
  }

  try {
    await connectDB()

    const query: Record<string, unknown> = {}
    if (filters.category) query.category = filters.category
    if (filters.brand) query.brand = filters.brand
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {}
      if (filters.minPrice !== undefined) (query.price as any).$gte = filters.minPrice
      if (filters.maxPrice !== undefined) (query.price as any).$lte = filters.maxPrice
    }
    if (filters.minRating !== undefined) query.rating = { $gte: filters.minRating }
    if (filters.search) {
      const q = filters.search
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ]
    }

    let sortObj: Record<string, 1 | -1> = { featured: -1, rating: -1 }
    switch (filters.sort) {
      case "price-asc": sortObj = { price: 1 }; break
      case "price-desc": sortObj = { price: -1 }; break
      case "rating": sortObj = { rating: -1 }; break
      case "newest": sortObj = { createdAt: -1 }; break
    }

    const page = filters.page || 1
    const limit = filters.limit || 12
    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ])

    // If MongoDB is empty, fall back to static data
    if (total === 0 && !filters.category && !filters.brand && !filters.search) {
      const staticProducts = PRODUCTS_DATA.slice(skip, skip + limit)
      return NextResponse.json({
        products: staticProducts,
        total: PRODUCTS_DATA.length,
        page,
        limit,
        totalPages: Math.ceil(PRODUCTS_DATA.length / limit),
        source: "static",
      })
    }

    const normalized = products.map((p: any) => ({ ...p, id: p._id.toString() }))
    return NextResponse.json({ products: normalized, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch {
    // DB error – fall back to static data
    const page = filters.page || 1
    const limit = filters.limit || 12
    const skip = (page - 1) * limit
    const staticProducts = PRODUCTS_DATA.slice(skip, skip + limit)
    return NextResponse.json({
      products: staticProducts,
      total: PRODUCTS_DATA.length,
      page,
      limit,
      totalPages: Math.ceil(PRODUCTS_DATA.length / limit),
      source: "static",
    })
  }
}
