import { z } from 'zod'
import { ZONA_OPTIONS } from '@/lib/constants'

/**
 * Mensajes por campo. Cada esquema lleva `error` en el constructor para que
 * también cubra el caso "falta el campo" (FormData devuelve null): sin eso,
 * zod mostraría su texto genérico en inglés ("expected string, received null").
 */
export const REGISTER_MESSAGES = {
  business_name: 'Escribe el nombre de tu negocio.',
  category_id: 'Elige el servicio principal de tu negocio.',
  zona: 'Elige la zona donde atiendes más seguido.',
  email: 'Escribe un correo válido. Ahí te llega tu acceso.',
} as const

export const RegisterSchema = z.object({
  business_name: z
    .string({ error: REGISTER_MESSAGES.business_name })
    .trim()
    .min(2, { error: REGISTER_MESSAGES.business_name })
    .max(120, { error: 'Usa máximo 120 caracteres.' }),
  category_id: z.uuid({ error: REGISTER_MESSAGES.category_id }),
  zona: z.enum(ZONA_OPTIONS, { error: REGISTER_MESSAGES.zona }),
  email: z
    .string({ error: REGISTER_MESSAGES.email })
    .trim()
    .pipe(z.email({ error: REGISTER_MESSAGES.email }).max(200, { error: REGISTER_MESSAGES.email })),
})

export type RegisterFieldErrors = Partial<Record<keyof z.infer<typeof RegisterSchema>, string[]>>

export function parseRegistration(formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    business_name: formData.get('business_name'),
    category_id: formData.get('category_id'),
    zona: formData.get('zona'),
    email: formData.get('email'),
  })
  if (parsed.success) return { data: parsed.data }
  return { fieldErrors: z.flattenError(parsed.error).fieldErrors as RegisterFieldErrors }
}
