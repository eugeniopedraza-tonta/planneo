import Link from 'next/link'
import { planneoContactHref } from '@/lib/planneo-contact'

/**
 * Cero resultados en el catálogo. Dos casos distintos, para no culpar al usuario:
 * - `unfiltered`: no hay filtros y aun así no hay nadie → todavía no publicamos
 *   proveedores aquí. Invitamos a escribirnos.
 * - `filtered`: la combinación de filtros no da → ofrecemos limpiarlos.
 */
export default function CatalogEmptyState(
  props:
    | { kind: 'unfiltered'; categoryName?: string }
    | { kind: 'filtered'; clearHref: string; allHref: string; fechaLabel?: string }
) {
  if (props.kind === 'unfiltered') {
    const what = props.categoryName ? props.categoryName.toLowerCase() : 'proveedores'
    const contact = planneoContactHref(
      props.categoryName
        ? `Hola, busco ${what} para mi evento en Monterrey.`
        : 'Hola, busco proveedores para mi evento en Monterrey.'
    )
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] px-6 py-12 text-center sm:py-14">
        <h2 className="v4-display mx-auto max-w-xl text-xl font-bold tracking-[-0.04em] sm:text-2xl">
          Estamos sumando {what} en Monterrey.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
          {props.categoryName
            ? 'Todavía no publicamos proveedores en esta categoría. Dinos qué buscas y te conectamos.'
            : 'Todavía no publicamos proveedores aquí. Dinos qué buscas y te conectamos.'}
        </p>
        <a
          href={contact.href}
          target={contact.channel === 'whatsapp' ? '_blank' : undefined}
          rel={contact.channel === 'whatsapp' ? 'noopener noreferrer' : undefined}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-planneo-600 px-5 text-sm font-semibold text-white transition hover:bg-planneo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planneo-300"
        >
          {contact.channel === 'whatsapp' ? 'Escríbenos por WhatsApp' : 'Escríbenos'}
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-6 py-12 text-center sm:py-14">
      <h2 className="v4-display mx-auto max-w-xl text-xl font-bold tracking-[-0.04em] sm:text-2xl">
        No encontramos proveedores con esos filtros.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
        Prueba quitando alguno o busca en otra zona.
      </p>
      {props.fechaLabel && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
          Con fecha, quienes ya tienen ocupado el {props.fechaLabel} no se muestran.
        </p>
      )}
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={props.clearHref}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-planneo-600 px-5 text-sm font-semibold text-white transition hover:bg-planneo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planneo-300"
        >
          Limpiar filtros
        </Link>
        <Link
          href={props.allHref}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/15 px-5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-planneo-300"
        >
          Ver todos en Monterrey
        </Link>
      </div>
    </div>
  )
}
