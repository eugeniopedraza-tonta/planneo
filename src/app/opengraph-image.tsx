import { ImageResponse } from 'next/og'

// Imagen de marca para compartir rutas sin foto propia. Se genera en build.
export const alt = 'Planneo — Proveedores verificados para tu evento en Monterrey'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background:
            'radial-gradient(circle at 85% 15%, rgba(199,125,255,0.35), transparent 45%), radial-gradient(circle at 10% 100%, rgba(123,44,191,0.45), transparent 50%), #0E0B1A',
          color: '#F5F0FF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #7B2CBF 0%, #C77DFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 700,
              color: '#0E0B1A',
            }}
          >
            P
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1, color: '#C77DFF' }}>
            Planneo
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 980 }}>
            Proveedores verificados para tu evento en Monterrey
          </div>
          <div style={{ fontSize: 30, color: 'rgba(245,240,255,0.65)' }}>
            Bodas, XV años, graduaciones y eventos corporativos
          </div>
        </div>

        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #4A148C 0%, #7B2CBF 50%, #C77DFF 100%)',
          }}
        />
      </div>
    ),
    size
  )
}
