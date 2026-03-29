import Link from "next/link"
import { ArrowRight, Zap, Truck, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Ofertas de temporada hasta -30%
            </span>
          </div>

          {/* Heading */}
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Tu destino premium de{" "}
            <span className="text-primary">tecnologia</span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
            Descubre los mejores productos de tecnologia y electronica.
            Laptops, smartphones, audio, gaming y mucho mas con los mejores
            precios del mercado.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2 px-8">
              <Link href="/catalogo">
                Explorar catalogo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/catalogo?sort=newest">Novedades</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <span className="text-sm">Envio gratis desde $99</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Garantia de 2 anos</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span className="text-sm">Entrega en 24-48h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2" aria-hidden="true">
        <div className="h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>
    </section>
  )
}
