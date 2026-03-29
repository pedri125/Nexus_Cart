import { db } from "../lib/firebaseAdmin"

// Inline product IDs and metadata for seeding
const products = [
  { id: "prod-001", category: "laptops", brand: "Apple", featured: true, stock: 15, ts: "2025-01-15T00:00:00Z" },
  { id: "prod-002", category: "laptops", brand: "Dell", featured: true, stock: 23, ts: "2025-02-01T00:00:00Z" },
  { id: "prod-003", category: "laptops", brand: "Lenovo", featured: false, stock: 31, ts: "2025-01-20T00:00:00Z" },
  { id: "prod-004", category: "smartphones", brand: "Apple", featured: true, stock: 42, ts: "2025-03-01T00:00:00Z" },
  { id: "prod-005", category: "smartphones", brand: "Samsung", featured: true, stock: 38, ts: "2025-02-20T00:00:00Z" },
  { id: "prod-006", category: "smartphones", brand: "Google", featured: false, stock: 27, ts: "2025-01-10T00:00:00Z" },
  { id: "prod-007", category: "audio", brand: "Sony", featured: true, stock: 56, ts: "2025-01-05T00:00:00Z" },
  { id: "prod-008", category: "audio", brand: "Apple", featured: true, stock: 89, ts: "2025-02-10T00:00:00Z" },
  { id: "prod-009", category: "audio", brand: "JBL", featured: false, stock: 45, ts: "2025-01-25T00:00:00Z" },
  { id: "prod-010", category: "wearables", brand: "Apple", featured: true, stock: 19, ts: "2025-02-15T00:00:00Z" },
  { id: "prod-011", category: "wearables", brand: "Samsung", featured: false, stock: 33, ts: "2025-01-18T00:00:00Z" },
  { id: "prod-012", category: "gaming", brand: "Sony", featured: true, stock: 22, ts: "2025-01-02T00:00:00Z" },
  { id: "prod-013", category: "gaming", brand: "Nintendo", featured: false, stock: 67, ts: "2025-02-05T00:00:00Z" },
  { id: "prod-014", category: "gaming", brand: "Razer", featured: false, stock: 41, ts: "2025-01-28T00:00:00Z" },
  { id: "prod-015", category: "tablets", brand: "Apple", featured: true, stock: 14, ts: "2025-03-05T00:00:00Z" },
  { id: "prod-016", category: "tablets", brand: "Samsung", featured: false, stock: 21, ts: "2025-02-12T00:00:00Z" },
  { id: "prod-017", category: "accesorios", brand: "Apple", featured: false, stock: 78, ts: "2025-01-08T00:00:00Z" },
  { id: "prod-018", category: "accesorios", brand: "Logitech", featured: true, stock: 62, ts: "2025-02-18T00:00:00Z" },
  { id: "prod-019", category: "accesorios", brand: "Apple", featured: false, stock: 150, ts: "2025-01-12T00:00:00Z" },
  { id: "prod-020", category: "monitores", brand: "LG", featured: true, stock: 18, ts: "2025-01-30T00:00:00Z" },
  { id: "prod-021", category: "monitores", brand: "Samsung", featured: false, stock: 12, ts: "2025-02-25T00:00:00Z" },
  { id: "prod-022", category: "monitores", brand: "ASUS", featured: false, stock: 25, ts: "2025-01-22T00:00:00Z" },
  { id: "prod-023", category: "almacenamiento", brand: "Samsung", featured: false, stock: 95, ts: "2025-01-06T00:00:00Z" },
  { id: "prod-024", category: "almacenamiento", brand: "WD", featured: false, stock: 43, ts: "2025-02-08T00:00:00Z" },
  { id: "prod-025", category: "almacenamiento", brand: "SanDisk", featured: false, stock: 120, ts: "2025-01-14T00:00:00Z" },
  { id: "prod-026", category: "redes", brand: "ASUS", featured: false, stock: 29, ts: "2025-02-22T00:00:00Z" },
  { id: "prod-027", category: "redes", brand: "TP-Link", featured: false, stock: 55, ts: "2025-01-16T00:00:00Z" },
  { id: "prod-028", category: "camaras", brand: "Sony", featured: true, stock: 11, ts: "2025-03-02T00:00:00Z" },
  { id: "prod-029", category: "camaras", brand: "GoPro", featured: false, stock: 34, ts: "2025-02-14T00:00:00Z" },
  { id: "prod-030", category: "camaras", brand: "DJI", featured: true, stock: 16, ts: "2025-01-24T00:00:00Z" },
]

async function seedProducts() {
  console.log("Seeding products into Firestore...")

  const batch = db.batch()

  for (const p of products) {
    const ref = db.collection("products").doc(p.id)
    batch.set(ref, {
      ...p,
      ts: new Date(p.ts),
    })
  }

  await batch.commit()

  console.log(`Successfully seeded ${products.length} products!`)

  const categories = [...new Set(products.map(p => p.category))]
  for (const cat of categories) {
    const count = products.filter(p => p.category === cat).length
    console.log(`  - ${cat}: ${count} products`)
  }
  console.log(`Featured products: ${products.filter(p => p.featured).length}`)
}

seedProducts().catch(console.error)
