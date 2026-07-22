'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATERING_CATEGORY_SLUG, VENUE_CATEGORY_SLUG } from '@/lib/constants'
import type { Provider, Category } from '@/lib/types'

type Props = {
  provider: (Pick<Provider, 'id' | 'name' | 'status'> & { categories: Pick<Category, 'slug'> | null }) | null
  role: string
}

type NavItem = {
  href: string
  label: string
  icon: (props: { active?: boolean }) => React.ReactNode
  exact?: boolean
}

const NAV: NavItem[] = [
  { href: '/panel', label: 'Dashboard', icon: DashboardIcon, exact: true },
  { href: '/panel/perfil', label: 'Mi perfil', icon: ProfileIcon },
  { href: '/panel/fotos', label: 'Fotos', icon: PhotosIcon },
  { href: '/panel/media', label: 'Audio / Video', icon: MediaIcon },
  { href: '/panel/paquetes', label: 'Paquetes', icon: PackagesIcon },
  { href: '/panel/disponibilidad', label: 'Disponibilidad', icon: CalendarIcon },
  { href: '/panel/consultas', label: 'Consultas', icon: InboxIcon },
  { href: '/panel/agenda', label: 'Agenda', icon: AgendaIcon },
]

export default function PanelSidebar({ provider, role }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const categorySlug = provider?.categories?.slug

  const visibleNav = NAV.filter((item) => {
    if (item.href === '/panel/menu') return categorySlug === CATERING_CATEGORY_SLUG
    if (item.href === '/panel/salon') return categorySlug === VENUE_CATEGORY_SLUG
    return true
  })

  const extraNav: NavItem[] = [
    ...(categorySlug === CATERING_CATEGORY_SLUG
      ? [{ href: '/panel/menu', label: 'Menú', icon: MenuIcon }]
      : []),
    ...(categorySlug === VENUE_CATEGORY_SLUG
      ? [{ href: '/panel/salon', label: 'Salón', icon: BuildingIcon }]
      : []),
  ]

  const allNav = [...visibleNav.slice(0, 5), ...extraNav, ...visibleNav.slice(5)]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-56 shrink-0 bg-planneo-900 border-r border-white/10 flex flex-col">
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <Link href="/panel">
          <span className="v4-display bg-[linear-gradient(120deg,#9D4EDD_0%,#C77DFF_100%)] bg-clip-text text-lg font-bold text-transparent">Planneo</span>
        </Link>
        {role === 'provider_pending' && (
          <span className="ml-2 text-xs bg-amber-300/10 text-amber-200 border border-amber-300/30 px-1.5 py-0.5 rounded-full font-medium">
            Pendiente
          </span>
        )}
      </div>

      {provider && (
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs font-medium text-white truncate">{provider.name}</p>
          <p className="text-xs text-white/50 truncate capitalize">{provider.categories?.slug ?? 'Sin categoría'}</p>
        </div>
      )}

      {role === 'provider_pending' && (
        <div className="mx-3 mt-3 rounded-xl bg-amber-300/10 border border-amber-300/30 px-3 py-2">
          <p className="text-xs text-amber-200 font-medium">Perfil en revisión</p>
          <p className="text-xs text-amber-200 mt-0.5">Aprobamos en 24–48 hrs.</p>
        </div>
      )}

      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        {allNav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-planneo-600/20 text-planneo-300'
                  : 'text-white/60 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Icon active={active} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10 flex flex-col gap-1">
        <Link
          href="/proveedores"
          target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/55 hover:bg-white/15 hover:text-white/85 transition-colors"
        >
          <EyeIcon />
          Ver catálogo
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/55 hover:bg-white/15 hover:text-white/85 transition-colors w-full text-left"
        >
          <LogoutIcon />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function DashboardIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}
function ProfileIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
function PhotosIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function MediaIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  )
}
function PackagesIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
function CalendarIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function AgendaIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 16l2 2 4-4" />
    </svg>
  )
}
function InboxIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}
function MenuIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}
function BuildingIcon({ active }: { active?: boolean }) {
  return (
    <svg className={`size-4 shrink-0 ${active ? 'text-planneo-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg className="size-4 shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg className="size-4 shrink-0 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}
