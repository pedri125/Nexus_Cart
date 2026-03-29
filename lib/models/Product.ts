import mongoose, { Schema, model, models } from "mongoose"

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: Number },
    images: [{ type: String }],
    category: { type: String, required: true },
    brand: { type: String, required: true },
    specs: { type: Map, of: String, default: {} },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Product = models.Product ?? model("Product", ProductSchema)
