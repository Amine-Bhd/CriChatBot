"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { CriLogo } from "./cri-logo"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/procedures", label: "Procedures et incitations" },
  { href: "/foncier", label: "Foncier" },
  { href: "/recours", label: "Recours" },
  { href: "/mon-cri", label: "Mon CRI" },
  { href: "/faq", label: "FAQ" },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link href="/" className="flex-shrink-0" aria-label="CRI Accueil">
          <CriLogo className="h-10 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors rounded-md",
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Auth buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="#"
            className="rounded-full border border-primary px-5 py-2 text-sm font-medium text-primary hover:bg-secondary transition-colors"
          >
            {"S'inscrire"}
          </Link>
          <Link
            href="#"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Se connecter
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-border bg-background" aria-label="Navigation mobile">
          <div className="flex flex-col px-4 py-4 gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "text-primary bg-secondary"
                      : "text-muted-foreground hover:text-primary hover:bg-secondary"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
              <Link
                href="#"
                className="rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary text-center hover:bg-secondary transition-colors"
              >
                {"S'inscrire"}
              </Link>
              <Link
                href="#"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground text-center hover:bg-primary/90 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
