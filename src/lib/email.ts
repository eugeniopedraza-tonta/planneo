import { Resend } from 'resend'

export async function sendWelcomeEmail(to: string, providerName: string) {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Planneo <hola@planneo.mx>',
    to,
    subject: `Tu perfil "${providerName}" está activo en Planneo`,
    html: `
      <h2>¡Bienvenido a Planneo!</h2>
      <p>Tu perfil <strong>${providerName}</strong> ya está activo.</p>
      <p>Puedes editarlo y ver tus estadísticas en:</p>
      <a href="https://planneo.mx/mi-perfil">planneo.mx/mi-perfil</a>
      <br/><br/>
      <p>— El equipo de Planneo</p>
    `,
  })
}
