import { Resend } from 'resend'

const FROM = 'Planneo <hola@planneo.mx>'
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://planneo.mx'

function resend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

/** El lugar del evento lo escribe el cliente: se escapa antes de inyectarlo al HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendWelcomeEmail(to: string, providerName: string) {
  const client = resend()
  if (!client) return
  await client.emails.send({
    from: FROM,
    to,
    subject: `Tu perfil "${providerName}" está activo en Planneo`,
    html: `
      <h2>¡Bienvenido a Planneo!</h2>
      <p>Tu perfil <strong>${providerName}</strong> ya está activo.</p>
      <p>Puedes editarlo y ver tus estadísticas en:</p>
      <a href="${SITE}/panel">${SITE}/panel</a>
      <br/><br/>
      <p>— El equipo de Planneo</p>
    `,
  })
}

export async function sendRegistrationNotification(businessName: string, contactEmail: string) {
  const client = resend()
  if (!client) return
  await client.emails.send({
    from: FROM,
    to: 'hola@planneo.mx',
    subject: `Nueva solicitud de proveedor: ${businessName}`,
    html: `
      <h2>Nueva solicitud de registro</h2>
      <p><strong>Negocio:</strong> ${businessName}</p>
      <p><strong>Email:</strong> ${contactEmail}</p>
      <p>Revisa y aprueba en:</p>
      <a href="${SITE}/admin/solicitudes">${SITE}/admin/solicitudes</a>
    `,
  })
}

export async function sendApprovalEmail(to: string, providerName: string) {
  const client = resend()
  if (!client) return
  await client.emails.send({
    from: FROM,
    to,
    subject: `¡Tu perfil en Planneo fue aprobado!`,
    html: `
      <h2>¡Estás en Planneo!</h2>
      <p>Tu perfil <strong>${providerName}</strong> fue aprobado y ya es visible en el catálogo.</p>
      <p>Completa tu información en tu panel:</p>
      <a href="${SITE}/panel">${SITE}/panel</a>
      <br/><br/>
      <p>— El equipo de Planneo</p>
    `,
  })
}

/** Confirmación al cliente al enviar su solicitud de cotización. */
export async function sendInquiryReceivedEmail(to: string, providerName: string, token: string) {
  const client = resend()
  if (!client) return
  await client.emails.send({
    from: FROM,
    to,
    subject: `Recibimos tu solicitud para ${providerName}`,
    html: `
      <h2>¡Solicitud enviada!</h2>
      <p><strong>${providerName}</strong> recibió tu solicitud de cotización.</p>
      <p>Cuando te responda, podrás ver la cotización aquí:</p>
      <a href="${SITE}/consulta/${token}">${SITE}/consulta/${token}</a>
      <p>Guarda este enlace: es tu acceso a la conversación.</p>
      <br/>
      <p>— El equipo de Planneo</p>
    `,
  })
}

/** Aviso al cliente cuando el proveedor responde su consulta. */
export async function sendQuoteReplyEmail(to: string, providerName: string, token: string) {
  const client = resend()
  if (!client) return
  await client.emails.send({
    from: FROM,
    to,
    subject: `${providerName} respondió tu solicitud en Planneo`,
    html: `
      <h2>Tienes una respuesta</h2>
      <p><strong>${providerName}</strong> respondió a tu solicitud de cotización.</p>
      <p>Revísala y contesta desde aquí:</p>
      <a href="${SITE}/consulta/${token}">${SITE}/consulta/${token}</a>
      <br/><br/>
      <p>— El equipo de Planneo</p>
    `,
  })
}

/** Aviso al cliente cuando el proveedor confirma la reservación. */
export async function sendBookingConfirmedEmail(
  to: string,
  providerName: string,
  token: string,
  eventDate: string,
  eventLocation: string | null
) {
  const client = resend()
  if (!client) return
  const [y, m, d] = eventDate.split('-').map(Number)
  const dateLabel = new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  await client.emails.send({
    from: FROM,
    to,
    subject: `${providerName} confirmó tu reservación en Planneo`,
    html: `
      <h2>¡Reservación confirmada!</h2>
      <p><strong>${providerName}</strong> confirmó tu evento.</p>
      <p><strong>Fecha:</strong> ${dateLabel}</p>
      ${eventLocation ? `<p><strong>Lugar:</strong> ${escapeHtml(eventLocation)}</p>` : ''}
      <p>Puedes ver los detalles y seguir la conversación aquí:</p>
      <a href="${SITE}/consulta/${token}">${SITE}/consulta/${token}</a>
      <br/><br/>
      <p>— El equipo de Planneo</p>
    `,
  })
}

export async function sendRejectionEmail(to: string, providerName: string) {
  const client = resend()
  if (!client) return
  await client.emails.send({
    from: FROM,
    to,
    subject: `Actualización sobre tu solicitud en Planneo`,
    html: `
      <h2>Sobre tu solicitud</h2>
      <p>Revisamos tu solicitud para <strong>${providerName}</strong> y por el momento no podemos incluirte en el catálogo.</p>
      <p>Si crees que es un error, escríbenos a hola@planneo.mx.</p>
      <br/>
      <p>— El equipo de Planneo</p>
    `,
  })
}
