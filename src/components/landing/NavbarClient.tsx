"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FloatingNavbar from "@/components/ui/floating-navbar";
import { Button } from "@/components/ui/button";
import EventCart from "@/components/event-cart";
import { canAccessProviderPanel, homeForRole } from "@/lib/auth-routes";
import { isCartEnabled, isEventPlannerEnabled, isOrganizerAccountsEnabled } from "@/lib/feature-flags";

type NavUser = {
  email: string | null;
  role: unknown;
} | null;

// "Diario" vuelve cuando exista /diario. "Crear evento" es Fase 2 (flag).
const NAV_LINKS = [
  { label: "Catálogo", href: "/catalogo" },
  ...(isEventPlannerEnabled() ? [{ label: "Crear evento", href: "/#crear-evento" }] : []),
  { label: "Para proveedores", href: "/para-proveedores" },
];

function dashboardHref(user: NavUser) {
  return homeForRole(user?.role);
}

function dashboardLabel(user: NavUser) {
  if (user?.role === "admin") return "Admin";
  if (canAccessProviderPanel(user?.role)) return "Mi perfil";
  return "Mis consultas";
}

function showDashboardLink(user: NavUser) {
  if (!user) return false;
  if (user.role === "admin" || canAccessProviderPanel(user.role)) return true;
  return isOrganizerAccountsEnabled();
}

export default function NavbarClient({ user }: { user: NavUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const signedIn = !!user;

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <FloatingNavbar>
      <div className="mx-auto px-12 lg:px-24">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="inline-flex min-h-11 shrink-0 items-center" aria-label="Planneo inicio">
            <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_48%,#C77DFF_100%)] bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
              Planneo
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-25" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-sm font-medium text-white/65 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isCartEnabled() && <EventCart />}
            {signedIn ? (
              <>
                {showDashboardLink(user) && (
                <Button variant="ghost" size="sm" className="min-h-11 text-white/75 hover:bg-white/10 hover:text-white" asChild>
                  <Link href={dashboardHref(user)}>{dashboardLabel(user)}</Link>
                </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="min-h-11 text-white/55 hover:bg-white/10 hover:text-white"
                >
                  {loggingOut ? "Saliendo..." : "Cerrar sesión"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="min-h-11 text-white/75 hover:bg-white/10 hover:text-white" asChild>
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
                <Button size="sm" className="v4-cta-glow min-h-11 rounded-xl border-transparent bg-planneo-600 text-white hover:bg-planneo-500" asChild>
                  <Link href="/buscar">Buscar proveedor</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {isCartEnabled() && <EventCart />}
          <button
            className="min-h-11 min-w-11 rounded-xl p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
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
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-planneo-950/95 px-4 pb-4 pt-2 backdrop-blur-md">
          <nav className="flex flex-col gap-1" aria-label="Navegación móvil">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center rounded-lg px-3 py-3 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/10">
              {signedIn ? (
                <>
                  {showDashboardLink(user) && (
                  <Button variant="ghost" className="min-h-11 w-full justify-center text-white hover:bg-white/10" asChild>
                    <Link href={dashboardHref(user)}>{dashboardLabel(user)}</Link>
                  </Button>
                  )}
                  <Button variant="ghost" className="min-h-11 w-full justify-center text-white/70 hover:bg-white/10" onClick={handleLogout}>
                    {loggingOut ? "Saliendo..." : "Cerrar sesión"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="min-h-11 w-full justify-center text-white hover:bg-white/10" asChild>
                    <Link href="/login">Iniciar sesión</Link>
                  </Button>
                  <Button className="min-h-11 w-full justify-center rounded-xl bg-planneo-600 text-white hover:bg-planneo-500" asChild>
                    <Link href="/buscar">Buscar proveedor</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </FloatingNavbar>
  );
}
