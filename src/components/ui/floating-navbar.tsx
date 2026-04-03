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
              backgroundColor: "rgba(255,255,255,0.85)",
              boxShadow: "0 1px 24px 0 rgba(124,58,237,0.08), 0 1px 4px 0 rgba(0,0,0,0.06)",
            }
          : {
              backdropFilter: "blur(0px)",
              backgroundColor: "rgba(255,255,255,0)",
              boxShadow: "none",
            }
      }
      transition={{ duration: 0.25 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-transparent",
        scrolled && "border-gray-100/60",
        className
      )}
    >
      {children}
    </motion.header>
  );
}
