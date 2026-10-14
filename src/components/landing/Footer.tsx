import Link from "next/link";
import { isEventPlannerEnabled } from "@/lib/feature-flags";

// "Diario" vuelve cuando exista /diario. "Crear evento" es Fase 2 (flag).
const FOOTER_LINKS = {
  Explora: [
    { label: "Categorías", href: "/#categorias" },
    { label: "Buscar proveedores", href: "/buscar" },
    { label: "Catálogo", href: "/catalogo" },
    ...(isEventPlannerEnabled() ? [{ label: "Crear evento", href: "/#crear-evento" }] : []),
  ],
  Planneo: [
    { label: "Para proveedores", href: "/para-proveedores" },
    { label: "Iniciar sesión", href: "/login" },
  ],
  Legal: [
    { label: "Privacidad", href: "/privacidad" },
    { label: "Términos de uso", href: "/terminos" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-planneo-950 px-4 py-14 text-planneo-ink sm:px-6 lg:px-14">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_1fr_360px]">
        <div>
          <Link href="/" className="v4-display inline-flex min-h-11 items-center bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_50%,#C77DFF_100%)] bg-clip-text text-2xl font-bold text-transparent">
            Planneo
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/55">
            Marketplace curado para encontrar proveedores de eventos sociales en Monterrey. Hecho para cotizar rápido, sin fricción.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="v4-mono mb-4 text-xs text-planneo-300">{category}</h3>
              {/* Filas de 44px (objetivo táctil); -my-3 compensa el aire extra arriba y abajo. */}
              <ul className="-my-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="inline-flex min-h-11 items-center text-sm text-white/55 transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <p className="v4-mono text-xs text-planneo-mint">¿ERES PROVEEDOR?</p>
          <h3 className="v4-display mt-3 text-2xl font-bold tracking-[-0.04em]">Tu perfil, gratis.</h3>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Los clientes te escriben directo a tu WhatsApp, sin intermediarios.
          </p>
          <Link href="/para-proveedores" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-planneo-600 px-5 text-sm font-semibold text-white transition hover:bg-planneo-500">
            Crear mi perfil
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Planneo · Hecho en Monterrey</p>
      </div>
    </footer>
  );
}
