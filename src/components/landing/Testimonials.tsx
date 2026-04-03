"use client";

import { useReducedMotion, motion } from "framer-motion";
import AnimatedCard from "@/components/ui/animated-card";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Encontré al músico perfecto para la boda de mi hija en menos de 24 horas. El proceso fue increíblemente sencillo.",
    name: "María González",
    role: "Organizadora de eventos",
    initials: "MG",
  },
  {
    quote:
      "Como músico, Planneo me ha dado una visibilidad que nunca tuve. Mis reservas aumentaron un 300% en dos meses.",
    name: "Carlos Méndez",
    role: "Músico de Jazz",
    initials: "CM",
  },
  {
    quote:
      "La garantía de reembolso me dio la confianza que necesitaba para reservar por primera vez. Totalmente recomendado.",
    name: "Roberto Sánchez",
    role: "Empresario",
    initials: "RS",
  },
];

export default function Testimonials() {
  const reduced = useReducedMotion();

  return (
    <section id="testimonios" className="py-20 lg:py-28 bg-[#F9FAFB]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
            Lo que dicen nuestros usuarios
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, index) => (
            <motion.div
              key={t.name}
              initial={reduced ? undefined : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={reduced ? undefined : { duration: 0.45, delay: index * 0.12 }}
            >
              <AnimatedCard>
                <div className="p-6 flex flex-col gap-4 h-full">
                  {/* Quote mark */}
                  <span className="text-5xl font-serif leading-none text-[#7C3AED] select-none" aria-hidden="true">
                    "
                  </span>

                  {/* Quote text */}
                  <p className="text-[#374151] text-sm leading-relaxed flex-1">
                    {t.quote}
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">{t.initials}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[#111827] text-sm">{t.name}</p>
                      <p className="text-[#6B7280] text-xs">{t.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
