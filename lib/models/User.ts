import mongoose, { Schema, model, models } from "mongoose"

const UserSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "admin", "employee"],
      default: "customer",
    },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
  },
  { timestamps: true }
)

export const User = models.User ?? model("User", UserSchema)
