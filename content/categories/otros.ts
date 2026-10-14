import { DRAFT_NOTE, type CategoryContent } from './types'

const otros: CategoryContent = {
  slug: 'otros',
  draft: true,
  authorNote: DRAFT_NOTE,
  editorialTitle: 'Cómo elegir otros servicios para tu evento en Monterrey',
  editorial: [
    'Hay servicios que no son lo primero que piensas al organizar un evento, pero que hacen la diferencia entre un día tranquilo y uno lleno de pendientes: planeación y coordinación, protocolo, transporte, valet parking, seguridad, servicio médico y niñeras. Aquí reunimos a esos proveedores.',
    'Una planner o coordinadora te ayuda desde meses antes, con presupuesto, calendario y proveedores, o solo el día del evento, para que tú no tengas que estar resolviendo nada. Pregunta qué incluye cada modalidad, a cuántas juntas asiste, si visita el lugar contigo y cuántas personas de su equipo estarán ese día.',
    'El transporte y el valet dependen mucho del lugar. Si tu evento es en una hacienda o quinta a las afueras, un camión para invitados evita que la gente maneje de regreso de noche. Si el estacionamiento es limitado, el valet ordena la llegada. Pide que te confirmen número de unidades o personas, horarios y seguro.',
    'La seguridad y el servicio médico son especialmente útiles en eventos grandes, corporativos o con muchos menores. Pregunta por la experiencia del equipo en eventos similares y qué protocolo siguen ante un incidente. Para niñeras o zona infantil, confirma cuántos cuidadores habrá por niño, qué actividades llevan y en qué espacio del lugar estarán.',
    'Comparte con cada proveedor tu itinerario y el contacto de la persona que coordina el día. En Planneo puedes revisar los proveedores publicados en esta categoría y escribirles directo por WhatsApp para resolver dudas y confirmar fecha.',
  ],
  faqs: [
    {
      question: '¿Necesito una wedding planner o solo coordinación del día?',
      answer:
        'Si tienes poco tiempo o muchos proveedores, una planeación completa te quita carga desde el inicio. Si ya tienes todo contratado, una coordinadora del día se asegura de que el itinerario se cumpla y te deja disfrutar.',
    },
    {
      question: '¿Cuándo conviene contratar transporte para invitados?',
      answer:
        'Cuando el lugar queda lejos, el estacionamiento es limitado o habrá barra libre y quieres que tus invitados regresen seguros. Define puntos de salida y horarios de regreso con el proveedor.',
    },
    {
      question: '¿Qué preguntar a un servicio de valet parking?',
      answer:
        'Cuántos valets enviará según tus invitados, dónde se estacionarán los autos, si cuentan con seguro y cuál es el horario de servicio.',
    },
  ],
}

export default otros
