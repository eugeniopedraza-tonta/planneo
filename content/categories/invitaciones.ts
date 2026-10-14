import { DRAFT_NOTE, type CategoryContent } from './types'

const invitaciones: CategoryContent = {
  slug: 'invitaciones',
  draft: true,
  authorNote: DRAFT_NOTE,
  editorialTitle: 'Cómo elegir tus invitaciones y detalles en Monterrey',
  editorial: [
    'La invitación es lo primero que tus invitados ven de tu evento, así que da el tono desde antes de que llegue el día. Hoy la mayoría combina formatos: una invitación digital para mandar por WhatsApp, con mapa, itinerario y confirmación de asistencia, y algunas impresas para familiares o padrinos que las aprecian en papel.',
    'Si eliges digital, pregunta qué incluye: diseño personalizado o plantilla, página web o solo imagen, confirmación de asistencia, mesa de regalos, cuenta regresiva y cuántos cambios puedes pedir. Si eliges impresa, pide muestras de papel y acabados, y confirma tiempos de producción y entrega, que suelen ser más largos de lo que esperas.',
    'Calcula los tiempos hacia atrás. Las invitaciones suelen enviarse con varias semanas de anticipación, y antes de eso necesitas tener fecha, lugar y horario confirmados. Para bodas fuera de Monterrey o con invitados de otras ciudades, considera mandar antes un "aparta la fecha".',
    'Los detalles del día también cuentan: señalética de bienvenida, plano de mesas, menús, números de mesa y recuerdos. Coordina todo con el mismo estilo gráfico para que se vea cuidado. Si quieres recuerdos personalizados, piensa en algo útil o comestible que tus invitados sí se lleven a casa.',
    'Revisa con calma nombres, fechas y direcciones antes de aprobar el diseño final; un error en papel es caro de corregir. En Planneo puedes ver los proveedores de invitaciones y detalles publicados y escribirles directo por WhatsApp para pedir muestras y tiempos.',
  ],
  faqs: [
    {
      question: '¿Invitación digital o impresa?',
      answer:
        'Depende de tus invitados y tu presupuesto. La digital es práctica, rápida de enviar y facilita confirmar asistencia; la impresa se siente más formal y muchas familias la conservan. Es común combinar ambas.',
    },
    {
      question: '¿Con cuánta anticipación se mandan las invitaciones?',
      answer:
        'Generalmente varias semanas antes del evento, y más si hay invitados que viajan. Considera además el tiempo de diseño y producción, sobre todo en impresas.',
    },
    {
      question: '¿Qué datos necesito para empezar el diseño?',
      answer:
        'Nombres tal como quieres que aparezcan, fecha, hora, lugar de ceremonia y recepción, código de vestimenta, datos de mesa de regalos y el estilo o paleta de colores que te guste.',
    },
  ],
}

export default invitaciones
