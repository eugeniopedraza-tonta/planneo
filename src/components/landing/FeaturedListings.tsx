"use client";

import { useReducedMotion, motion } from "framer-motion";
import ListingCard from "@/components/ui/ListingCard";
import type { ListingCardProps } from "@/components/ui/ListingCard";

const LISTINGS: ListingCardProps[] = [
  { name: "Sofía Ramírez", genre: "Clásica", rating: 4.8, reviewCount: 94, location: "CDMX", pricePerHour: 3200 },
  { name: "DJ Neon", genre: "Electrónica", rating: 4.7, reviewCount: 210, location: "Guadalajara", pricePerHour: 1800 },
  { name: "Trio Norteño Regio", genre: "Norteño", rating: 5.0, reviewCount: 67, location: "Monterrey", pricePerHour: 2100 },
  { name: "Elena Voss", genre: "Pop", rating: 4.9, reviewCount: 183, location: "CDMX", pricePerHour: 2800 },
  { name: "Banda La Fuerza", genre: "Banda", rating: 4.6, reviewCount: 45, location: "Guadalajara", pricePerHour: 3500 },
  { name: "Marco Jazz", genre: "Jazz", rating: 4.9, reviewCount: 312, location: "Monterrey", pricePerHour: 2500 },
];

export default function FeaturedListings() {
  const reduced = useReducedMotion();

  return (
    <section id="buscar-musicos" className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4">
            Músicos Destacados
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Descubre el talento perfecto para tu próximo evento
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LISTINGS.map((listing, index) => (
            <motion.div
              key={listing.name}
              initial={reduced ? undefined : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={reduced ? undefined : { duration: 0.4, delay: index * 0.1 }}
            >
              <ListingCard {...listing} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
