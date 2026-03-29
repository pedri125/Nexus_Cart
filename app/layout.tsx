
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { LayoutShell } from "@/components/layout-shell"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "NexusCart - Tu Destino Premium de Tecnologia",
    template: "%s | NexusCart",
  },
  description:
    "Descubre los mejores productos de tecnologia y electronica. Laptops, smartphones, audio, gaming y mas con precios competitivos y envio rapido.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LayoutShell>{children}</LayoutShell>
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
