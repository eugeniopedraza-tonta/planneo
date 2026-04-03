"use client";

import { useReducedMotion, motion } from "framer-motion";
import Spotlight from "@/components/ui/spotlight";
import AnimatedCard from "@/components/ui/animated-card";

const TRUST_BADGES = [
  "✓ Músicos verificados",
  "✓ Pagos seguros",
  "✓ Soporte 24/7",
  "✓ Sin comisiones ocultas",
];

export default function Hero() {
  const reduced = useReducedMotion();

  const animTransition = { duration: 0.6 };

  return (
    <Spotlight className="min-h-screen bg-gradient-to-b from-white to-[#F9FAFB] pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduced ? undefined : animTransition}
            className="flex flex-col gap-6"
          >
            {/* Badge pill */}
            <div className="inline-flex w-fit items-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED] font-medium text-sm px-4 py-1.5 border border-[#7C3AED]/20">
              ✦ La plataforma #1 para eventos en México
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#111827] leading-tight tracking-tight">
              Planifica más inteligente, reserva más rápido, celebra más fácil.
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-[#6B7280] leading-relaxed max-w-xl">
              Conectamos a los mejores músicos con quienes crean momentos inolvidables.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <a
                href="#buscar-musicos"
                className="inline-flex items-center justify-center rounded-full bg-[#7C3AED] text-white font-semibold text-base px-7 py-3.5 hover:bg-[#6D28D9] transition-colors shadow-md shadow-[#7C3AED]/30"
              >
                Comenzar Gratis
              </a>
              <a
                href="#buscar-musicos"
                className="inline-flex items-center justify-center rounded-full border border-[#7C3AED] text-[#7C3AED] font-semibold text-base px-7 py-3.5 hover:bg-[#7C3AED]/5 transition-colors"
              >
                Explorar Músicos
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full bg-[#F9FAFB] border border-gray-200 text-[#6B7280] text-xs font-medium px-3 py-1.5"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right column — mock listing card */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduced ? undefined : animTransition}
            className="flex justify-center lg:justify-end"
          >
            <div className="w-full max-w-sm">
              <AnimatedCard>
                {/* Placeholder image */}
                <div className="bg-gray-100 aspect-[4/3] flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#111827] text-lg">Carlos Méndez</h3>
                    <span className="inline-flex items-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-medium px-2.5 py-1">
                      Jazz
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-amber-400">★★★★★</span>
                    <span className="font-semibold text-[#111827]">4.9</span>
                    <span className="text-[#6B7280]">(128 reseñas)</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Monterrey, NL
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-semibold text-[#111827]">desde $2,500/hr</span>
                    <button className="rounded-full bg-[#7C3AED] text-white text-sm font-medium px-4 py-2 hover:bg-[#6D28D9] transition-colors cursor-pointer">
                      Ver Perfil
                    </button>
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </motion.div>
        </div>
      </div>
    </Spotlight>
  );
}
