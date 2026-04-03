"use client";

import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import AnimatedCard from "@/components/ui/animated-card";

export interface ListingCardProps {
  name: string;
  genre: string;
  rating: number;
  reviewCount: number;
  location: string;
  pricePerHour: number;
  imageUrl?: string;
}

function formatMXN(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ListingCard({
  name,
  genre,
  rating,
  reviewCount,
  location,
  pricePerHour,
}: ListingCardProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <AnimatedCard>
      <div
        className="flex flex-col h-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Placeholder image */}
        <div className="relative bg-gray-100 aspect-[4/3] flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
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

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[#111827] text-base leading-tight">{name}</h3>
            <span className="shrink-0 inline-flex items-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-medium px-2.5 py-0.5">
              {genre}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 text-sm">
            <span className="text-amber-400">★</span>
            <span className="font-medium text-[#111827]">{rating.toFixed(1)}</span>
            <span className="text-[#6B7280]">({reviewCount} reseñas)</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-[#6B7280]">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {location}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-sm font-semibold text-[#111827]">
              desde {formatMXN(pricePerHour)}/hr
            </span>
            <AnimatePresence>
              {hovered && (
                <motion.button
                  key="ver-perfil"
                  initial={reduced ? false : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-full bg-[#7C3AED] text-white text-xs font-medium px-3 py-1.5 hover:bg-[#6D28D9] transition-colors cursor-pointer"
                >
                  Ver Perfil
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}
