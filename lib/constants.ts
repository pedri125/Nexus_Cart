import type { Category } from "./types"
import { PRODUCTS_DATA } from "./products-data"

/** Cuenta productos por categoría desde los datos reales */
function countByCategory(slug: string): number {
  return PRODUCTS_DATA.filter((p) => p.category === slug).length
}

export const CATEGORIES: Category[] = [
  {
    id: "laptops",
    name: "Laptops",
    slug: "laptops",
    description: "Portatiles de alto rendimiento para trabajo y gaming",
    icon: "Laptop",
    productCount: countByCategory("laptops"),
  },
  {
    id: "smartphones",
    name: "Smartphones",
    slug: "smartphones",
    description: "Los ultimos smartphones con la mejor tecnologia",
    icon: "Smartphone",
    productCount: countByCategory("smartphones"),
  },
  {
    id: "audio",
    name: "Audio",
    slug: "audio",
    description: "Auriculares, altavoces y equipos de sonido premium",
    icon: "Headphones",
    productCount: countByCategory("audio"),
  },
  {
    id: "wearables",
    name: "Wearables",
    slug: "wearables",
    description: "Relojes inteligentes y dispositivos fitness",
    icon: "Watch",
    productCount: countByCategory("wearables"),
  },
  {
    id: "gaming",
    name: "Gaming",
    slug: "gaming",
    description: "Consolas, perifericos y accesorios gaming",
    icon: "Gamepad2",
    productCount: countByCategory("gaming"),
  },
  {
    id: "tablets",
    name: "Tablets",
    slug: "tablets",
    description: "Tablets para productividad y entretenimiento",
    icon: "Tablet",
    productCount: countByCategory("tablets"),
  },
  {
    id: "accesorios",
    name: "Accesorios",
    slug: "accesorios",
    description: "Cargadores, cables, fundas y mas",
    icon: "Cable",
    productCount: countByCategory("accesorios"),
  },
  {
    id: "monitores",
    name: "Monitores",
    slug: "monitores",
    description: "Monitores de alta resolucion para trabajo y gaming",
    icon: "Monitor",
    productCount: countByCategory("monitores"),
  },
]

export const BRANDS = [
  "Apple",
  "Samsung",
  "Sony",
  "Dell",
  "Lenovo",
  "Google",
  "Microsoft",
  "LG",
  "JBL",
  "Razer",
  "Nintendo",
  "Logitech",
]

export const PRICE_RANGES = [
  { label: "Menos de $100", min: 0, max: 100 },
  { label: "$100 - $500", min: 100, max: 500 },
  { label: "$500 - $1,000", min: 500, max: 1000 },
  { label: "$1,000 - $2,000", min: 1000, max: 2000 },
  { label: "Mas de $2,000", min: 2000, max: Infinity },
]

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "rating", label: "Mejor valorados" },
  { value: "newest", label: "Mas recientes" },
] as const

export const SITE_CONFIG = {
  name: "NexusCart",
  description: "Tu destino premium de tecnologia y electronica",
  url: "http://localhost:3000",
  defaultCountry: "Colombia",
  countryCode: "CO",
  currency: "COP",
  currencySymbol: "$",
  /** Envío gratis a partir de este monto (COP) */
  freeShippingMin: 199000,
  /** Costo de envío (COP) cuando no aplica gratis */
  shippingCost: 11900,
  /** IVA 19% Colombia */
  taxRate: 0.19,
}

/** Formatea precio en pesos colombianos */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
