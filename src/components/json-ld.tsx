import { serializeJsonLd, type JsonLdObject } from '@/lib/json-ld'

/**
 * <script type="application/ld+json"> nativo (no next/script: no es código
 * ejecutable). Uso: <JsonLd data={breadcrumbJsonLd([...])} />.
 */
export default function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      // serializeJsonLd escapa `<`, así que ningún valor puede cerrar el script.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
