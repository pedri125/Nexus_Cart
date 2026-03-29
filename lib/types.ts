export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  originalPrice?: number
  discount?: number
  images: string[]
  category: string
  brand: string
  specs: Record<string, string>
  rating: number
  reviewCount: number
  stock: number
  featured: boolean
  createdAt: string
}

export interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  /** Stock máximo disponible del producto */
  maxStock?: number
}

export interface User {
  id: string
  name: string
  email: string
  role: "customer" | "admin" | "employee"
  createdAt: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}

export type PaymentMethod = "card" | "paypal" | "pse" | "nequi"

export interface Order {
  id: string
  userId: string
  userEmail: string
  userName: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentMethod: PaymentMethod
  shippingAddress: ShippingAddress
  createdAt: string
}


export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

export interface ShippingAddress {
  fullName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  productCount: number
}

export type SortOption = "relevance" | "price-asc" | "price-desc" | "rating" | "newest"

export interface ProductFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  search?: string
  sort?: SortOption
  page?: number
  limit?: number
}

export interface Supplier {
  _id: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseItem {
  productId: string
  name: string
  quantity: number
  unitCost: number
}

export interface Purchase {
  _id: string
  supplierId: string
  supplierName: string
  items: PurchaseItem[]
  totalCost: number
  status: "pending" | "received" | "cancelled"
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

export interface Sale {
  _id: string
  orderId?: string
  userId: string
  userEmail: string
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentMethod: "card" | "paypal" | "pse" | "nequi" | "cash"
  createdAt: string
  updatedAt: string
}

export interface StockAlert {
  _id: string
  name: string
  slug: string
  stock: number
  category: string
  brand: string
}
