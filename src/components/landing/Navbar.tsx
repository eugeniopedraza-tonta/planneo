"use client";

import { useState } from "react";
import Logo from "@/components/ui/logo";
import FloatingNavbar from "@/components/ui/floating-navbar";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Cómo Funciona", href: "#como-funciona" },
  { label: "Buscar Músicos", href: "#buscar-musicos" },
  { label: "Precios", href: "#precios" },
  { label: "Testimonios", href: "#testimonios" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <FloatingNavbar>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 shrink-0" aria-label="Planneo inicio">
            <Logo />
            <span className="font-bold text-lg text-[#111827] hidden sm:block">Planneo</span>
          </a>

          {/* Desktop center links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm">
              Iniciar Sesión
            </Button>
            <Button
              size="sm"
              className="bg-[#7C3AED] text-white hover:bg-[#6D28D9] border-transparent"
            >
              Registrarse
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1" aria-label="Navegación móvil">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#6B7280] hover:text-[#111827] hover:bg-gray-50 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100">
              <Button variant="outline" className="w-full justify-center">
                Iniciar Sesión
              </Button>
              <Button className="w-full justify-center bg-[#7C3AED] text-white hover:bg-[#6D28D9] border-transparent">
                Registrarse
              </Button>
            </div>
          </nav>
        </div>
      )}
    </FloatingNavbar>
  );
}
