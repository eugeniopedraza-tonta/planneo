import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminLogout from './_components/admin-logout'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'admin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex bg-planneo-950">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-planneo-900 border-r border-white/10 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <Link href="/admin">
            <span className="v4-display bg-[linear-gradient(120deg,#9D4EDD_0%,#C77DFF_100%)] bg-clip-text text-lg font-bold text-transparent">Planneo</span>
          </Link>
          <span className="ml-2 text-xs bg-planneo-600/20 text-planneo-300 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          <NavLink href="/admin">
            <DashboardIcon />
            Dashboard
          </NavLink>
          <NavLink href="/admin/proveedores">
            <ProvidersIcon />
            Proveedores
          </NavLink>
          <NavLink href="/admin/metricas">
            <MetricsIcon />
            Métricas
          </NavLink>
          <NavLink href="/admin/solicitudes">
            <SolicitudesIcon />
            Solicitudes
          </NavLink>
        </nav>

        <div className="p-3 border-t border-white/10">
          <AdminLogout />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/15 hover:text-white transition-colors font-medium"
    >
      {children}
    </Link>
  )
}

function DashboardIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function ProvidersIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function MetricsIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function SolicitudesIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}
