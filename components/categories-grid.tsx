import Link from "next/link"
import {
  Laptop,
  Smartphone,
  Headphones,
  Watch,
  Gamepad2,
  Tablet,
  Cable,
  Monitor,
} from "lucide-react"
import { CATEGORIES } from "@/lib/constants"

const ICON_MAP: Record<string, React.ElementType> = {
  Laptop,
  Smartphone,
  Headphones,
  Watch,
  Gamepad2,
  Tablet,
  Cable,
  Monitor,
}

export function CategoriesGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-10 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl text-balance">
          Compra por categoria
        </h2>
        <p className="text-muted-foreground">
          Encuentra exactamente lo que necesitas
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const Icon = ICON_MAP[category.icon] || Laptop
          return (
            <Link
              key={category.id}
              href={`/catalogo?category=${category.slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 text-center transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {category.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
