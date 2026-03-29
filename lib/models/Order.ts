import { Schema, model, models } from "mongoose"

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, default: "" },
  },
  { _id: false }
)

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: "" },
    zipCode: { type: String, default: "" },
    country: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
)

const OrderSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, default: "" },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "pse", "nequi"],
      default: "card",
    },
    shippingAddress: ShippingAddressSchema,
  },
  { timestamps: true }
)

export const Order = models.Order ?? model("Order", OrderSchema)
