import Link from "next/link";
import Spotlight from "@/components/ui/spotlight";
import { createStaticClient } from "@/lib/supabase/server";
import { ZONAS_MTY } from "@/lib/constants";
import { isEventPlannerEnabled } from "@/lib/feature-flags";
import HeroSearchForm from "./HeroSearchForm";

// Valores que entiende /buscar (`evento` = EVENT_TYPES.value en constants).
const HERO_EVENT_TYPES = [
  { value: "bodas", label: "Boda" },
  { value: "xv", label: "XV años" },
  { value: "corporativo", label: "Corporativo" },
  { value: "graduacion", label: "Graduación" },
  { value: "otro", label: "Otro" },
];

/** Cuántos proveedores están publicados. Si falla la consulta, 0: mejor ocultar el sello. */
async function getPublishedProviderCount() {
  const supabase = createStaticClient();
  const { count, error } = await supabase
    .from("providers")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (error) return 0;
  return count ?? 0;
}

export default async function Hero() {
  const publishedCount = await getPublishedProviderCount();

  // "Proveedores verificados" solo es cierto cuando ya hay publicados.
  const trust = [
    "Sin login para cotizar",
    "Contacto directo por WhatsApp",
    "Curado para MTY",
    ...(publishedCount > 0 ? ["Proveedores verificados"] : []),
  ];

  return (
    <Spotlight className="relative min-h-[760px] overflow-hidden bg-planneo-950 pt-16 text-planneo-ink lg:min-h-[820px]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(199,125,255,0.26),transparent_34%),linear-gradient(180deg,rgba(14,11,26,0.20),#0E0B1A_86%)]" />
        <VenueBackdrop />
        <div className="absolute left-[8%] top-[18%] h-52 w-52 rounded-full bg-planneo-600/35 blur-3xl [animation:v4-blob_18s_ease-in-out_infinite]" />
        <div className="absolute bottom-[18%] right-[10%] h-64 w-64 rounded-full bg-planneo-300/25 blur-3xl [animation:v4-blob_18s_ease-in-out_infinite_-6s]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(760px-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 lg:min-h-[calc(820px-4rem)] lg:px-8 lg:py-16">
        <div className="v4-glass v4-rise mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 [animation:v4-rise_.9s_cubic-bezier(.2,.8,.2,1)_both] lg:mb-8">
          <span className="size-2 rounded-full bg-planneo-mint" />
          Arrancando en Monterrey · 2026
        </div>

        <h1 className="v4-display mx-auto max-w-5xl text-2xl sm:text-3xl font-bold leading-[0.95] tracking-[-0.045em] text-white">
          Encuentra proveedores verificados para tu evento en{" "}
          <span className="bg-[linear-gradient(120deg,#F5F0FF_0%,#C77DFF_48%,#06D6A0_100%)] bg-clip-text text-transparent">
            Monterrey.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg lg:mt-8 lg:leading-8">
          Salones, música, banquete, foto, decoración y más para eventos sociales en Monterrey. Revisa su perfil y escríbeles directo por WhatsApp.
        </p>

        <HeroSearchForm
          className="v4-glass mt-8 grid w-full max-w-5xl grid-cols-1 gap-2 rounded-[28px] p-2 text-left shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] lg:mt-10 lg:grid-cols-[1.6fr_1fr_1fr_auto]"
        >
          <div className="flex min-h-14 min-w-0 flex-col justify-center rounded-[20px] border border-input px-4 transition focus-within:bg-white/[0.06] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-planneo-300">
            <label htmlFor="hero-q" className="v4-mono text-xs text-planneo-300">
              ¿Qué buscas?
            </label>
            <input
              id="hero-q"
              type="search"
              name="q"
              placeholder="¿Qué buscas? Ej: fotógrafo de bodas"
              className="mt-1 w-full min-w-0 bg-transparent text-base text-white outline-none placeholder:text-white/35"
            />
          </div>
          <HeroSelect id="hero-evento" name="evento" label="Tipo de evento" placeholder="Cualquier evento" options={HERO_EVENT_TYPES} />
          <HeroSelect
            id="hero-zona"
            name="zona"
            label="Zona"
            placeholder="Toda el área"
            options={ZONAS_MTY.map((z) => ({ value: z, label: z }))}
          />
          <button className="min-h-14 rounded-[18px] bg-planneo-600 px-7 font-semibold text-white transition hover:bg-planneo-500" type="submit">
            Buscar
          </button>
        </HeroSearchForm>

        {isEventPlannerEnabled() && (
          <Link
            href="/#crear-evento"
            className="v4-glass mt-5 inline-flex min-h-14 items-center justify-center rounded-[14px] px-8 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Crear mi evento
          </Link>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-white/55">
          {trust.map((item) => (
            <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
              <span className="size-1.5 rounded-full bg-planneo-mint" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </Spotlight>
  );
}

function HeroSelect({
  id,
  name,
  label,
  placeholder,
  options,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex min-h-14 min-w-0 flex-col justify-center rounded-[20px] border border-input px-4 transition focus-within:bg-white/[0.06] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-planneo-300">
      <label htmlFor={id} className="v4-mono text-xs text-planneo-300">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue=""
        className="mt-1 w-full min-w-0 cursor-pointer bg-transparent text-base text-white outline-none [color-scheme:dark]"
      >
        <option value="" className="bg-planneo-950">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-planneo-950">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function VenueBackdrop() {
  return (
    <div className="absolute inset-x-4 top-28 mx-auto h-[500px] max-w-6xl overflow-hidden rounded-[30px] opacity-55 sm:h-[620px] sm:rounded-[36px]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#26133F_0%,#7B2CBF_42%,#C77DFF_100%)]" />
      <div className="absolute left-[12%] top-[18%] h-72 w-40 rounded-t-full border border-white/24 bg-white/8" />
      <div className="absolute left-[31%] top-[26%] h-64 w-52 rounded-t-full border border-white/20 bg-black/10" />
      <div className="absolute right-[16%] top-[16%] h-80 w-44 rounded-t-full border border-white/24 bg-white/8" />
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-[linear-gradient(180deg,transparent,rgba(14,11,26,0.88))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_30%,rgba(255,255,255,.28),transparent_12%),radial-gradient(circle_at_72%_22%,rgba(255,255,255,.18),transparent_14%)]" />
    </div>
  );
}
