import mongoose, { Schema, model, models } from "mongoose"

const SupplierSchema = new Schema(
  {
    name: { type: String, required: true },
    contactName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    country: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Supplier = models.Supplier ?? model("Supplier", SupplierSchema)
