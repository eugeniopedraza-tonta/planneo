import { permanentRedirect } from 'next/navigation'

/**
 * El acceso es solo por código al correo (PLA-6): no hay contraseña que
 * recuperar. La ruta sobrevive por enlaces viejos y lleva directo al login.
 */
export default function RecuperarPage() {
  permanentRedirect('/login')
}
