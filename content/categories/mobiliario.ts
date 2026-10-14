import { DRAFT_NOTE, type CategoryContent } from './types'

const mobiliario: CategoryContent = {
  slug: 'mobiliario',
  draft: true,
  authorNote: DRAFT_NOTE,
  editorialTitle: 'Cómo elegir tu mobiliario y equipo en Monterrey',
  editorial: [
    'El mobiliario y el equipo son la parte menos glamorosa del evento y la que más problemas evita cuando está bien resuelta. Si tu lugar es una quinta, un jardín o una casa, probablemente tendrás que rentar casi todo: mesas, sillas, carpa, pista, audio, planta de luz y hasta sanitarios. Si es un salón, revisa primero qué incluye para no rentar de más.',
    'Empieza por el número de invitados y la distribución. Con eso el proveedor puede calcular mesas, sillas, tamaño de carpa y de pista de baile. Pide que te comparta un croquis o, al menos, las medidas, y verifica que todo quepa en el espacio con pasillos cómodos para meseros e invitados.',
    'El clima de Monterrey obliga a pensar en carpa y climatización. En verano, una carpa sin ventilación puede volverse muy caliente; en invierno o con lluvia, conviene preguntar por laterales y calefacción. Si el lugar no tiene suficiente corriente para audio, iluminación y banquete, la planta de luz no es opcional.',
    'Pregunta qué incluye la renta: flete, montaje, desmontaje, horario de entrega y recolección, y qué pasa si algo se daña. Revisa el estado de sillas, mantelería y pistas en fotos recientes o en persona. Si contratas audio e iluminación técnica por separado de la música, coordina quién opera el equipo.',
    'Los juegos e inflables son un mundo aparte: confirma medidas, superficie donde se instalan y si incluyen a alguien que supervise a los niños. En Planneo puedes revisar los proveedores de mobiliario y equipo publicados y escribirles directo por WhatsApp con tus medidas y fecha.',
  ],
  faqs: [
    {
      question: '¿Qué tamaño de carpa necesito?',
      answer:
        'Depende del número de invitados, del acomodo (mesas redondas, imperiales) y de si la pista, el banquete y la música van bajo la misma carpa. Comparte con el proveedor tu número de invitados y las medidas del terreno para que te recomiende una medida.',
    },
    {
      question: '¿El flete y el montaje van incluidos?',
      answer:
        'A veces sí y a veces se cobran aparte, sobre todo si el lugar queda lejos o si el montaje es en horario especial. Pídelo por escrito en la cotización.',
    },
    {
      question: '¿Necesito planta de luz?',
      answer:
        'Si el lugar no tiene instalación suficiente para audio, iluminación, banquete y climatización al mismo tiempo, sí. Pregunta al lugar la capacidad eléctrica disponible y compártela con tus proveedores.',
    },
    {
      question: '¿Qué pasa si se daña algo rentado?',
      answer:
        'Cada proveedor tiene sus propias condiciones; muchos piden un depósito en garantía. Revisa las condiciones antes de contratar y al recibir el mobiliario.',
    },
  ],
}

export default mobiliario
