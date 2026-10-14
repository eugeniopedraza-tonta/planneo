"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";

/**
 * GET a /buscar que funciona sin JS. Con JS, navega sin los campos vacíos
 * para que la URL quede limpia (`/buscar?q=foto` en vez de `?q=foto&evento=&zona=`).
 */
export default function HeroSearchForm({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    });
    const qs = params.toString();
    router.push(qs ? `/buscar?${qs}` : "/buscar");
  }

  return (
    <form action="/buscar" method="get" role="search" aria-label="Buscar proveedores" onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}
