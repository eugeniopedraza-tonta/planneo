"use client";

import { useReducedMotion, motion } from "framer-motion";

const STEPS = [
  {
    number: "1",
    title: "Describe tu evento",
    description:
      "Cuéntanos qué tipo de evento tienes y qué estilo musical buscas.",
  },
  {
    number: "2",
    title: "Explora y compara",
    description:
      "Navega perfiles verificados, escucha demos y compara precios.",
  },
  {
    number: "3",
    title: "Reserva con confianza",
    description:
      "Contrata de forma segura con garantía de reembolso.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HowItWorks() {
  const reduced = useReducedMotion();

  return (
    <section id="como-funciona" className="py-20 lg:py-28 bg-[#F9FAFB]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
            Cómo Funciona Planneo
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Nuestro proceso simplificado te lleva del concepto a la celebración
          </p>
        </div>

        {/* Steps */}
        <motion.div
          variants={reduced ? undefined : containerVariants}
          initial={reduced ? undefined : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0"
        >
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Connector line (between steps, desktop only) */}
              {index < STEPS.length - 1 && (
                <div
                  className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] z-0"
                  aria-hidden="true"
                />
              )}

              <motion.div
                variants={reduced ? undefined : itemVariants}
                className="relative z-10 flex flex-col items-center gap-4"
              >
                {/* Circle */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-lg shadow-[#7C3AED]/30">
                  <span className="text-white font-bold text-lg">{step.number}</span>
                </div>

                <div className="px-4">
                  <h3 className="font-semibold text-[#111827] text-lg mb-2">{step.title}</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed max-w-xs">{step.description}</p>
                </div>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
