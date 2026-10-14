import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { loadOnboardingState } from '../../../_lib/readiness'
import DescriptionEditor from './_editor'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Describe tu servicio',
  robots: { index: false, follow: false },
}

/**
 * Preguntas y chips por categoría. Sirven para que el proveedor no se enfrente
 * a un textarea vacío; el texto que se genera es una plantilla con sus propias
 * respuestas, nunca datos inventados (experiencia, premios, precios).
 */
const PROMPTS: Record<string, { question: string; chips: string[] }> = {
  'foto-video': {
    question: '¿Qué tipo de momentos te gusta capturar?',
    chips: ['Fotografía', 'Video', 'Cabina de fotos', '360', 'Dron', 'Same day edit'],
  },
  belleza: {
    question: '¿Qué servicios ofreces?',
    chips: ['Maquillaje', 'Peinado', 'Uñas', 'Spa', 'Vestidos y trajes', 'Renta de vestuario'],
  },
  musica: {
    question: '¿Qué formatos manejas?',
    chips: ['DJ', 'Grupo versátil', 'Banda', 'Mariachi', 'Solistas (sax, violín)', 'Hora loca'],
  },
  banquete: {
    question: '¿Qué tipo de menús preparas?',
    chips: ['Catering', 'Taquizas y parrilladas', 'Pastelería y postres', 'Mesa de dulces', 'Barra y bartender', 'Meseros'],
  },
  decoracion: {
    question: '¿Qué tipo de montajes haces?',
    chips: ['Floristería', 'Globos', 'Backdrops', 'Letras y números', 'Mantelería', 'Centros de mesa'],
  },
  lugares: {
    question: '¿Cómo es tu espacio?',
    chips: ['Salones', 'Jardines', 'Haciendas', 'Terrazas y roof gardens', 'Quintas', 'Casas de eventos'],
  },
  mobiliario: {
    question: '¿Qué rentas o instalas?',
    chips: ['Sillas y mesas', 'Carpas', 'Pistas de baile', 'Audio e iluminación técnica', 'Pantallas', 'Planta de luz'],
  },
  invitaciones: {
    question: '¿Qué piezas produces?',
    chips: ['Invitaciones digitales e impresas', 'Imprenta', 'Diseño gráfico', 'Señalética', 'Recuerdos y souvenirs', 'Personalizados'],
  },
  otros: {
    question: '¿Qué servicio complementas?',
    chips: ['Planeación y coordinación', 'Protocolo', 'Transporte y limusinas', 'Valet parking', 'Seguridad', 'Niñeras'],
  },
}

const DEFAULT_PROMPT = {
  question: '¿Qué servicio ofreces y para qué eventos?',
  chips: ['Bodas', 'XV años', 'Corporativos', 'Cumpleaños', 'Graduaciones'],
}

export default async function DescripcionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const state = await loadOnboardingState(supabase, user.id)
  if (!state) redirect('/registrarme')

  const categorySlug = state.provider.categories?.slug ?? ''
  const prompt = PROMPTS[categorySlug] ?? DEFAULT_PROMPT

  return (
    <div className="max-w-2xl p-6 sm:p-8">
      <Link href="/panel/onboarding" className="text-xs text-white/45 underline hover:text-white/70">
        ← Volver a la activación
      </Link>

      <h1 className="mt-4 text-xl font-semibold text-white">Describe tu servicio</h1>
      <p className="mt-1 text-sm text-white/60">
        Una descripción clara ayuda a que te contacten por el servicio correcto.
      </p>

      <DescriptionEditor
        question={prompt.question}
        chips={prompt.chips}
        businessName={state.provider.name}
        categoryName={state.provider.categories?.name ?? 'servicios para eventos'}
        zona={state.provider.zona}
        initialDescription={state.provider.description ?? ''}
      />
    </div>
  )
}
