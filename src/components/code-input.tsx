'use client'

import { useRef, useState } from 'react'

const LENGTH = 6

/**
 * Input de código de verificación con un cuadro por dígito.
 * Envía el valor completo en un input oculto con el `name` indicado,
 * por lo que funciona dentro de formularios con server actions.
 */
export default function CodeInput({
  name,
  error = false,
  disabled = false,
}: {
  name: string
  error?: boolean
  disabled?: boolean
}) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const focusBox = (index: number) => {
    refs.current[Math.max(0, Math.min(index, LENGTH - 1))]?.focus()
  }

  // Acepta escritura normal, pegado del código completo y el autocompletado
  // "one-time-code" (que inserta varios caracteres de golpe).
  const handleChange = (index: number, raw: string) => {
    let incoming = raw.replace(/\D/g, '')

    // Si el cuadro ya tenía un dígito y no se reemplazó la selección
    // (p. ej. al pegar), descartamos el dígito anterior.
    const prev = digits[index]
    if (prev && incoming.length > 1) {
      if (incoming.startsWith(prev)) incoming = incoming.slice(1)
      else if (incoming.endsWith(prev)) incoming = incoming.slice(0, -1)
    }

    setDigits((prev) => {
      const next = [...prev]
      if (!incoming) {
        next[index] = ''
        return next
      }
      for (let i = 0; i < incoming.length && index + i < LENGTH; i++) {
        next[index + i] = incoming[i]
      }
      return next
    })

    if (incoming) {
      focusBox(index + incoming.length)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault()
      setDigits((prev) => {
        const next = [...prev]
        next[index - 1] = ''
        return next
      })
      focusBox(index - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusBox(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusBox(index + 1)
    }
  }

  const boxCls = [
    'h-13 w-full min-w-0 rounded-xl border bg-white/10 text-center text-xl font-semibold text-white',
    'caret-planneo-300 outline-none transition-colors',
    'focus:border-planneo-300 focus:bg-white/[0.07] focus:ring-2 focus:ring-planneo-300/25',
    'disabled:opacity-60',
    error ? 'border-red-500/50' : 'border-white/10',
  ].join(' ')

  return (
    <div className="flex items-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Dígito ${i + 1} de ${LENGTH}`}
          disabled={disabled}
          className={boxCls}
        />
      ))}
      <input type="hidden" name={name} value={digits.join('')} />
    </div>
  )
}
