import { redirect } from 'next/navigation'

/**
 * Antes era una pantalla final sin salida ("te avisaremos en 24–48 horas") que
 * ni siquiera enlazaba al panel. Ahora el registro termina en el hub de
 * activación; la ruta sobrevive solo por los enlaces que ya salieron por correo.
 */
export default function GraciasPage() {
  redirect('/panel/onboarding')
}
