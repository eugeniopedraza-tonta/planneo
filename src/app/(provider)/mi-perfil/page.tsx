import { redirect } from 'next/navigation'

// El panel del proveedor vive ahora en /panel (PLAN.md §3.2).
export default function MiPerfilPage() {
  redirect('/panel')
}
