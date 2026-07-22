'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { importProvidersCsv } from '@/app/admin/proveedores/_actions'

type ImportResult = { created: number; errors: { row: number; message: string }[] }

export default function CsvImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function parseRow(line: string, headers: string[]): Record<string, string> {
    const values = line.split(',').map((v) => v.trim())
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) {
      alert('El archivo está vacío o no tiene datos.')
      setLoading(false)
      return
    }

    const headers = lines[0].split(',').map((h) => h.trim())
    const rows = lines.slice(1).map((line) => parseRow(line, headers))

    const res = await importProvidersCsv(rows)
    setResult(res)
    setLoading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? 'Importando…' : 'Importar CSV'}
      </Button>

      {result && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setResult(null)}>
          <div className="bg-planneo-900 rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-3">Resultado de importación</h3>
            <p className="text-sm text-planneo-mint mb-2">✓ {result.created} proveedores creados</p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-red-300 mb-1">{result.errors.length} errores:</p>
                <ul className="text-xs text-red-400 max-h-40 overflow-auto flex flex-col gap-1">
                  {result.errors.map((e) => (
                    <li key={e.row}>Fila {e.row}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button className="mt-4 w-full" onClick={() => setResult(null)}>Cerrar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
