'use client'

import { useEffect, useState, type RefObject } from 'react'

/**
 * ¿Queda contenido oculto a la izquierda / derecha de un carril horizontal?
 * Sirve para mostrar el desvanecido solo cuando de verdad hay más por ver:
 * desaparece al llegar al final y cuando el carril no desborda (p. ej. en
 * desktop, donde los chips hacen wrap).
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>) {
  const [edges, setEdges] = useState({ start: false, end: false })

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const update = () => {
      const overflowing = node.scrollWidth > node.clientWidth + 1
      const start = overflowing && node.scrollLeft > 1
      const end = overflowing && node.scrollLeft + node.clientWidth < node.scrollWidth - 1
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
    }

    update()
    node.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => {
      node.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [ref])

  return edges
}
