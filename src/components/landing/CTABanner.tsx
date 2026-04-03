"use client";

import { useReducedMotion, motion } from "framer-motion";

export default function CTABanner() {
  const reduced = useReducedMotion();

  return (
    <section
      id="precios"
      className="py-20 lg:py-28 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9]"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-8">
        <motion.h2
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reduced ? undefined : { duration: 0.5 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight"
        >
          ¿Listo para encontrar el músico perfecto?
        </motion.h2>

        <motion.p
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reduced ? undefined : { duration: 0.5, delay: 0.1 }}
          className="text-white/80 text-lg max-w-xl"
        >
          Únete a miles de organizadores que ya confían en Planneo
        </motion.p>

        <motion.a
          href="#buscar-musicos"
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={reduced ? undefined : { duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center justify-center rounded-full border-2 border-white text-white font-semibold text-base px-8 py-3.5 hover:bg-white hover:text-[#7C3AED] transition-colors"
        >
          Comenzar Gratis
        </motion.a>
      </div>
    </section>
  );
}
