import Link from "next/link"
import { CATEGORIES, SITE_CONFIG } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-foreground"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-black">
                N
              </span>
              {SITE_CONFIG.name}
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {SITE_CONFIG.description}. Encuentra los mejores productos de
              tecnologia con precios competitivos y envio rapido.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Categorias
            </h3>
            <ul className="flex flex-col gap-2">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/catalogo?category=${cat.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Soporte
            </h3>
            <ul className="flex flex-col gap-2">
              {[
                "Centro de ayuda",
                "Envios y devoluciones",
                "Garantia",
                "Contacto",
                "FAQ",
              ].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground cursor-default">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Legal
            </h3>
            <ul className="flex flex-col gap-2">
              {[
                "Terminos y condiciones",
                "Politica de privacidad",
                "Politica de cookies",
              ].map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground cursor-default">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            2026 {SITE_CONFIG.name}. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Hecho con Next.js, Tailwind CSS y Upstash Redis
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
