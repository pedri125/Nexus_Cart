import mongoose, { Schema, model, models } from "mongoose"

const PurchaseItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitCost: { type: Number, required: true },
  },
  { _id: false }
)

const PurchaseSchema = new Schema(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierName: { type: String, required: true },
    items: [PurchaseItemSchema],
    totalCost: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "received", "cancelled"],
      default: "pending",
    },
    notes: { type: String },
  },
  { timestamps: true }
)

export const Purchase = models.Purchase ?? model("Purchase", PurchaseSchema)
