'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function homeForRole(role: unknown): string {
  if (role === 'admin') return '/admin'
  if (role === 'provider' || role === 'provider_pending') return '/panel'
  return '/mis-consultas'
}

function safeNext(): string | null {
  const next = new URLSearchParams(window.location.search).get('next')
  return next && next.startsWith('/') ? next : null
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      window.location.href = safeNext() ?? homeForRole(data.user.app_metadata?.role)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas')
      setLoading(false)
      return
    }

    const { data } = await supabase.auth.getUser()
    window.location.href = safeNext() ?? homeForRole(data.user?.app_metadata?.role)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0E0B1A] px-4 text-[#F5F0FF]">
      <div className="absolute left-[12%] top-[12%] h-56 w-56 rounded-full bg-[#7B2CBF]/35 blur-3xl" />
      <div className="absolute bottom-[15%] right-[10%] h-64 w-64 rounded-full bg-[#C77DFF]/20 blur-3xl" />
      <div className="v4-glass relative w-full max-w-sm rounded-[24px] p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="mb-8 text-center">
          <span className="v4-display bg-[linear-gradient(120deg,#4A148C_0%,#7B2CBF_50%,#C77DFF_100%)] bg-clip-text text-3xl font-bold text-transparent">
            Planneo
          </span>
          <p className="mt-2 text-sm text-white/55">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="-mt-2 text-right">
            <Link
              href="/recuperar"
              className="text-xs text-white/45 hover:text-[#C77DFF] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" disabled={loading} className="v4-cta-glow mt-2 w-full rounded-xl bg-[#7B2CBF] text-white hover:bg-[#6B22AE]">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>

          <div className="mt-2 flex flex-col gap-1.5 text-center text-xs text-white/45">
            <p>
              ¿Organizas un evento?{' '}
              <Link href="/crear-cuenta" className="text-[#C77DFF] hover:text-white transition-colors">
                Crea tu cuenta
              </Link>
            </p>
            <p>
              ¿Ofreces servicios?{' '}
              <Link href="/registrarme" className="text-[#C77DFF] hover:text-white transition-colors">
                Registra tu negocio
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
