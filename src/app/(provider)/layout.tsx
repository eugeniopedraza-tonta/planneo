import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessProviderPanel } from '@/lib/auth-routes'
import PanelSidebar from './_components/panel-sidebar'

export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (!canAccessProviderPanel(user.app_metadata?.role)) {
    redirect('/')
  }

  const { data: provider } = await supabase
    .from('providers')
    .select('id, name, status, category_id, categories(slug)')
    .eq('claimed_by', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen flex bg-planneo-950">
      <PanelSidebar provider={provider as Parameters<typeof PanelSidebar>[0]['provider']} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
