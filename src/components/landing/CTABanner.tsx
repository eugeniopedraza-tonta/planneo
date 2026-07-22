"use client";

import Link from "next/link";

export default function CTABanner() {
  return (
    <section id="proveedores" className="bg-planneo-950 px-4 py-20 text-white sm:px-6 lg:px-14 lg:py-28">
      <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[32px] bg-[linear-gradient(120deg,#7B2CBF_0%,#4A148C_100%)] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] sm:p-10 lg:grid-cols-[1fr_420px] lg:p-14">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-planneo-300/30 blur-3xl" />
        <div className="absolute -bottom-24 right-20 h-72 w-72 rounded-full bg-planneo-mint/15 blur-3xl" />

        <div className="relative">
          <p className="v4-mono mb-4 text-[11px] text-white/65">{"// PARA PROVEEDORES"}</p>
          <h2 className="v4-display max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl">
            Recibe leads directo en tu WhatsApp.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/72">
            Reclama tu perfil, mantén tu información actualizada y responde cotizaciones sin instalar otra app.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex min-h-14 items-center justify-center rounded-[14px] bg-white px-8 font-semibold text-planneo-700 transition hover:bg-white/90">
              Entrar al panel
            </Link>
            <Link href="/proveedores" className="inline-flex min-h-14 items-center justify-center rounded-[14px] border border-white/25 bg-white/10 px-8 font-semibold text-white backdrop-blur transition hover:bg-white/15">
              Ver catálogo
            </Link>
          </div>
        </div>

        <div className="relative mt-10 rounded-[24px] border border-white/15 bg-planneo-950/50 p-5 backdrop-blur-xl lg:mt-0">
          <div className="mb-5 flex items-center justify-between">
            <span className="v4-mono text-[10px] text-planneo-mint">NUEVO LEAD</span>
            <span className="flex items-center gap-2 text-xs text-white/65">
              <span className="size-2 rounded-full bg-planneo-mint [animation:v4-pulse_1.8s_ease-in-out_infinite]" />
              hace 2 min
            </span>
          </div>
          <div className="space-y-3 text-sm">
            <LeadRow label="Evento" value="Boda · 180 invitados" />
            <LeadRow label="Fecha" value="14 de septiembre" />
            <LeadRow label="Zona" value="Valle Oriente" />
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-white/75">
              Hola, vi tu perfil en Planneo. ¿Me puedes compartir disponibilidad y paquete inicial?
            </div>
          </div>
          <button className="mt-5 min-h-12 w-full rounded-[14px] bg-[#25D366] font-semibold text-white transition hover:bg-[#3BDF77]">
            Contactar al cliente
          </button>
        </div>
      </div>
    </section>
  );
}

function LeadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <span className="text-white/45">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
