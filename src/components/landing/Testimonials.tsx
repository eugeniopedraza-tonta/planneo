import Link from "next/link";

/**
 * Sección de prueba social. Hoy no hay testimonios reales: mostramos el
 * estado honesto del lanzamiento. Cuando existan citas verificadas, este es
 * el lugar para renderizarlas (sin estrellas mientras no haya reseñas reales).
 */
export default function Testimonials() {
  return (
    <section id="testimonios" className="bg-planneo-950 px-4 py-20 text-planneo-ink sm:px-6 lg:px-14 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 sm:p-10">
          <p className="v4-mono mb-4 text-xs text-planneo-300">{"// HOY"}</p>
          <p className="v4-display max-w-3xl text-2xl font-bold leading-[1] tracking-[-0.04em] sm:text-3xl">
            Estamos arrancando en Monterrey. Los primeros proveedores se están sumando ahora.
          </p>
          <Link
            href="/para-proveedores"
            className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-planneo-300 transition hover:text-white"
          >
            ¿Eres proveedor? Súmate →
          </Link>
        </div>
      </div>
    </section>
  );
}
