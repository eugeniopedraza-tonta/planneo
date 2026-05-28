"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FloatingNavbarProps {
  children: React.ReactNode;
  className?: string;
}

export default function FloatingNavbar({ children, className }: FloatingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      animate={
        scrolled
          ? {
              backdropFilter: "blur(12px)",
              backgroundColor: "rgba(14,11,26,0.72)",
              boxShadow: "0 18px 60px -32px rgba(0,0,0,0.8)",
            }
          : {
              backdropFilter: "blur(18px)",
              backgroundColor: "rgba(14,11,26,0.42)",
              boxShadow: "none",
            }
      }
      transition={{ duration: 0.25 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-white/10",
        className
      )}
    >
      {children}
    </motion.header>
  );
}
