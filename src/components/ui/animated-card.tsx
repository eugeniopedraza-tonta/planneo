"use client";

import { useReducedMotion, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedCard({ children, className }: AnimatedCardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl p-[1.5px]",
        "bg-gray-200",
        className
      )}
      whileHover={
        reduced
          ? undefined
          : {
              background:
                "linear-gradient(135deg, #7B2CBF 0%, #C77DFF 50%, #7B2CBF 100%)",
            }
      }
      transition={{ duration: 0.3 }}
    >
      <div className="relative rounded-2xl bg-white h-full w-full overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
}
