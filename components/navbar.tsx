"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Headphones,
  Watch,
  Gamepad2,
  Tablet,
  Cable,
  Monitor,
  LogOut,
  Settings,
  Package,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCartStore } from "@/store/cart-store"
import { useAuthStore } from "@/store/auth-store"
import { useAuth } from "@/hooks/useAuth"
import { CATEGORIES, SITE_CONFIG } from "@/lib/constants"
import { toast } from "sonner"

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Laptop,
  Smartphone,
  Headphones,
  Watch,
  Gamepad2,
  Tablet,
  Cable,
  Monitor,
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)
  const itemCount = items.reduce((c, i) => c + i.quantity, 0)
  const { user } = useAuthStore()
  const { logout } = useAuth()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 8)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Sesión cerrada correctamente")
      router.push("/")
    } catch {
      toast.error("Error al cerrar sesión")
    }
  }

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/catalogo", label: "Catalogo" },
  ]

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "?"

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-background border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-black">
            N
          </span>
          {SITE_CONFIG.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegacion principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Categories dropdown */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted ${
                    pathname.startsWith("/catalogo/") ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  Categorias
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.icon] || Laptop
                  return (
                    <DropdownMenuItem key={cat.id} asChild>
                      <Link
                        href={`/catalogo?category=${cat.slug}`}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {cat.name}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/catalogo"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted`}
            >
              Categorias
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
            <Link href="/buscar" aria-label="Buscar productos">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* User button: avatar con menú si logueado, ícono simple si no */}
          {mounted ? (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
                    aria-label="Mi cuenta"
                  >
                    {userInitial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/perfil" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Mi cuenta
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/perfil/pedidos" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Mis pedidos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/perfil/configuracion" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                <Link href="/perfil" aria-label="Mi cuenta">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            )
          ) : (
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
              <Link href="/perfil" aria-label="Mi cuenta">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/carrito" aria-label="Carrito de compras">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary p-0 text-[10px] text-primary-foreground">
                  {itemCount}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Mobile menu */}
          <div className="md:hidden">
            {mounted ? (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>
              <nav className="flex flex-col gap-4 pt-8" aria-label="Menu movil">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-border pt-4">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categorias
                  </p>
                  {CATEGORIES.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.icon] || Laptop
                    return (
                      <Link
                        key={cat.id}
                        href={`/catalogo?category=${cat.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        {cat.name}
                      </Link>
                    )
                  })}
                </div>
                <div className="border-t border-border pt-4 flex flex-col gap-2">
                  <Link
                    href="/buscar"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Search className="h-4 w-4" />
                    Buscar
                  </Link>
                  {user ? (
                    <>
                      <Link
                        href="/perfil"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <User className="h-4 w-4" />
                        {user.name}
                      </Link>
                      <button
                        onClick={() => { setMobileOpen(false); handleLogout() }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/perfil"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <User className="h-4 w-4" />
                      Mi cuenta
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
            ) : (
              <Button variant="ghost" size="icon" aria-label="Menu" className="pointer-events-none opacity-70">
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
