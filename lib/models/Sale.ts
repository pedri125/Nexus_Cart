import mongoose, { Schema, model, models } from "mongoose"

const SaleItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
)

const SaleSchema = new Schema(
  {
    orderId: { type: String },
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "pse", "nequi", "cash"],
      default: "card",
    },
  },
  { timestamps: true }
)

export const Sale = models.Sale ?? model("Sale", SaleSchema)
