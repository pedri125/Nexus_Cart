/**
 * Seed MongoDB with all products from products-data.ts, an admin user,
 * sample suppliers, purchases and sales.
 *
 * Run:  npx tsx scripts/seed-mongo.ts
 * Make sure MONGODB_URI is set in .env.local (or in env before running)
 */

import "dotenv/config"
import mongoose from "mongoose"
import path from "path"
import { config } from "dotenv"

// Load .env.local
config({ path: path.join(process.cwd(), ".env.local") })

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not set in .env.local")
  process.exit(1)
}

// ---- Models inline (no TS path aliases) ----
const ProductSchema = new mongoose.Schema(
  { name: String, slug: { type: String, unique: true }, description: String, shortDescription: String,
    price: Number, originalPrice: Number, discount: Number, images: [String],
    category: String, brand: String, specs: { type: Map, of: String, default: {} },
    rating: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 }, featured: { type: Boolean, default: false } },
  { timestamps: true }
)
const UserSchema = new mongoose.Schema(
  { firebaseUid: { type: String, unique: true }, name: String, email: String,
    role: { type: String, default: "customer" }, phone: String, address: String,
    city: String, state: String, zipCode: String, country: String },
  { timestamps: true }
)
const SupplierSchema = new mongoose.Schema(
  { name: String, contactName: String, email: String, phone: String,
    address: String, city: String, country: String, notes: String },
  { timestamps: true }
)
const PurchaseItemSchema = new mongoose.Schema({ productId: String, name: String, quantity: Number, unitCost: Number }, { _id: false })
const PurchaseSchema = new mongoose.Schema(
  { supplierId: mongoose.Schema.Types.ObjectId, supplierName: String,
    items: [PurchaseItemSchema], totalCost: Number,
    status: { type: String, default: "pending" }, notes: String },
  { timestamps: true }
)
const SaleItemSchema = new mongoose.Schema({ productId: String, name: String, quantity: Number, unitPrice: Number }, { _id: false })
const SaleSchema = new mongoose.Schema(
  { orderId: String, userId: String, userEmail: String, items: [SaleItemSchema],
    subtotal: Number, tax: Number, total: Number,
    status: { type: String, default: "pending" },
    paymentMethod: { type: String, default: "card" } },
  { timestamps: true }
)

const ProductModel = mongoose.model("Product", ProductSchema)
const UserModel = mongoose.model("User", UserSchema)
const SupplierModel = mongoose.model("Supplier", SupplierSchema)
const PurchaseModel = mongoose.model("Purchase", PurchaseSchema)
const SaleModel = mongoose.model("Sale", SaleSchema)

// ---- Mini product list for seed (first 10 items) ----
const PRODUCTS = [
  { name: "MacBook Pro 16\" M3 Max", slug: "macbook-pro-16-m3-max", category: "laptops", brand: "Apple", price: 3499, stock: 15, featured: true, rating: 4.9, reviewCount: 342, shortDescription: "Portatil profesional con chip M3 Max", description: "El MacBook Pro de 16 pulgadas con chip M3 Max.", images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop"], specs: { "Procesador": "Apple M3 Max", "RAM": "36 GB" } },
  { name: "Dell XPS 15", slug: "dell-xps-15", category: "laptops", brand: "Dell", price: 1899, stock: 23, featured: true, rating: 4.7, reviewCount: 189, shortDescription: "Ultrabook premium con pantalla OLED 3.5K", description: "El Dell XPS 15 con procesador Intel Core i9.", images: ["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop"], specs: { "Procesador": "Intel Core i9-13900H", "RAM": "32 GB" } },
  { name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max", category: "smartphones", brand: "Apple", price: 1199, stock: 42, featured: true, rating: 4.8, reviewCount: 567, shortDescription: "Smartphone con camara de 48 MP", description: "El iPhone 16 Pro Max.", images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=600&fit=crop"], specs: { "Procesador": "A18 Pro", "RAM": "8 GB" } },
  { name: "Samsung Galaxy S25 Ultra", slug: "samsung-galaxy-s25-ultra", category: "smartphones", brand: "Samsung", price: 1299, stock: 38, featured: true, rating: 4.7, reviewCount: 423, shortDescription: "Smartphone flagship con camara de 200 MP", description: "Samsung Galaxy S25 Ultra.", images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=600&fit=crop"], specs: { "Procesador": "Snapdragon 8 Elite", "RAM": "12 GB" } },
  { name: "Sony WH-1000XM5", slug: "sony-wh-1000xm5", category: "audio", brand: "Sony", price: 349, stock: 56, featured: true, rating: 4.8, reviewCount: 892, shortDescription: "Auriculares premium con ANC", description: "Auriculares inalambricos premium de Sony.", images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&h=600&fit=crop"], specs: { "Bateria": "30 horas" } },
  { name: "AirPods Pro 2", slug: "airpods-pro-2", category: "audio", brand: "Apple", price: 249, stock: 5, featured: true, rating: 4.7, reviewCount: 1243, shortDescription: "Auriculares in-ear con ANC", description: "AirPods Pro 2.", images: ["https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=600&fit=crop"], specs: { "Bateria": "6h (30h con estuche)" } },
  { name: "PlayStation 5 Slim", slug: "playstation-5-slim", category: "gaming", brand: "Sony", price: 449, stock: 22, featured: true, rating: 4.8, reviewCount: 1567, shortDescription: "Consola next-gen", description: "PS5 Slim.", images: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop"], specs: { "GPU": "10.28 TFLOPS RDNA 2" } },
  { name: "Apple Watch Ultra 2", slug: "apple-watch-ultra-2", category: "wearables", brand: "Apple", price: 799, stock: 0, featured: true, rating: 4.8, reviewCount: 234, shortDescription: "Reloj inteligente premium", description: "Apple Watch Ultra 2.", images: ["https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=600&fit=crop"], specs: { "Bateria": "36 horas" } },
  { name: "iPad Pro 13\" M4", slug: "ipad-pro-13-m4", category: "tablets", brand: "Apple", price: 1299, stock: 14, featured: true, rating: 4.9, reviewCount: 178, shortDescription: "Tablet profesional con chip M4", description: "iPad Pro M4.", images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=600&fit=crop"], specs: { "Procesador": "Apple M4" } },
  { name: "Logitech MX Master 3S", slug: "logitech-mx-master-3s", category: "accesorios", brand: "Logitech", price: 99, stock: 3, featured: true, rating: 4.8, reviewCount: 1089, shortDescription: "Raton inalambrico premium", description: "Logitech MX Master 3S.", images: ["https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&h=600&fit=crop"], specs: { "Sensor": "Darkfield 8000 DPI" } },
]

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log("✅ Conectado a MongoDB:", MONGODB_URI)

  // Products
  for (const p of PRODUCTS) {
    await ProductModel.findOneAndUpdate({ slug: p.slug }, p, { upsert: true })
  }
  console.log(`✅ ${PRODUCTS.length} productos sembrados`)

  // Admin user (placeholder firebaseUid – update with real UID after first login)
  await UserModel.findOneAndUpdate(
    { email: "admin@nexuscart.com" },
    { firebaseUid: "admin-placeholder-uid", name: "Admin NexusCart", email: "admin@nexuscart.com", role: "admin" },
    { upsert: true }
  )
  console.log("✅ Usuario admin sembrado (admin@nexuscart.com)")

  // Suppliers
  const s1 = await SupplierModel.findOneAndUpdate(
    { email: "techglobal@supplierco.com" },
    { name: "TechGlobal Distribuidores", contactName: "Carlos Mendez", email: "techglobal@supplierco.com", phone: "+57 300 123 4567", city: "Bogotá", country: "Colombia", notes: "Proveedor principal de laptops y smartphones" },
    { upsert: true, new: true }
  )
  const s2 = await SupplierModel.findOneAndUpdate(
    { email: "audioplus@providers.co" },
    { name: "AudioPlus Importaciones", contactName: "María García", email: "audioplus@providers.co", phone: "+57 311 987 6543", city: "Medellín", country: "Colombia", notes: "Especialistas en audio y accesorios" },
    { upsert: true, new: true }
  )
  console.log("✅ 2 proveedores sembrados")

  // Purchases
  const firstProduct = await ProductModel.findOne({ slug: "macbook-pro-16-m3-max" })
  if (firstProduct && s1) {
    await PurchaseModel.create({
      supplierId: s1._id, supplierName: s1.name,
      items: [{ productId: firstProduct._id.toString(), name: firstProduct.name, quantity: 5, unitCost: 2800 }],
      totalCost: 14000, status: "received", notes: "Primer pedido del trimestre"
    })
  }
  console.log("✅ Compra de muestra sembrada")

  // Sales
  const phone = await ProductModel.findOne({ slug: "iphone-16-pro-max" })
  if (phone) {
    await SaleModel.create({
      userId: "user-001", userEmail: "cliente@example.com",
      items: [{ productId: phone._id.toString(), name: phone.name, quantity: 1, unitPrice: phone.price }],
      subtotal: phone.price, tax: Math.round(phone.price * 0.19), total: Math.round(phone.price * 1.19),
      status: "delivered", paymentMethod: "card"
    })
    await SaleModel.create({
      userId: "user-002", userEmail: "comprador@demo.com",
      items: [{ productId: phone._id.toString(), name: phone.name, quantity: 2, unitPrice: phone.price }],
      subtotal: phone.price * 2, tax: Math.round(phone.price * 2 * 0.19), total: Math.round(phone.price * 2 * 1.19),
      status: "processing", paymentMethod: "nequi"
    })
  }
  console.log("✅ 2 ventas de muestra sembradas")

  await mongoose.disconnect()
  console.log("\n🎉 Seed completado exitosamente!")
  console.log("📌 Nota: Para tener un admin funcional, registra el usuario admin@nexuscart.com")
  console.log("   en Firebase y actualiza su firebaseUid en la colección 'users' de MongoDB.")
}

main().catch((err) => { console.error(err); process.exit(1) })
