import { HeroSection } from "@/components/hero-section"
import { CategoriesGrid } from "@/components/categories-grid"
import { FeaturedProducts } from "@/components/featured-products"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesGrid />
      <FeaturedProducts />
    </>
  )
}
