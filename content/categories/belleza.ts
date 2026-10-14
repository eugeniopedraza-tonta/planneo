import { DRAFT_NOTE, type CategoryContent } from './types'

const belleza: CategoryContent = {
  slug: 'belleza',
  draft: true,
  authorNote: DRAFT_NOTE,
  editorialTitle: 'Cómo elegir tu belleza e imagen en Monterrey',
  editorial: [
    'Maquillaje, peinado, uñas y vestuario son parte de cómo te sientes ese día, y también de cómo sales en las fotos. Antes de buscar, junta referencias de looks que te gusten y piensa en el tipo de evento: una boda de día en jardín pide algo distinto a una noche de gala o a unos XV años con cambio de vestido.',
    'Revisa el trabajo real de cada profesional, de preferencia fotos sin filtros y con luz natural, y busca ejemplos en tonos de piel y tipos de cabello parecidos a los tuyos. Si es posible, agenda una prueba de maquillaje y peinado con algunas semanas de anticipación; es el mejor momento para ajustar detalles y medir cuánto tiempo toma.',
    'El calor y la humedad de Monterrey influyen. Pregunta qué productos y técnicas usan para que el maquillaje y el peinado duren toda la noche, y si se quedan para retoques o te dejan un kit. Si el evento es al aire libre en verano, coméntalo desde el inicio.',
    'Si van a arreglarse varias personas (mamá, damas, quinceañera y corte), confirma cuántas personas atiende el equipo, cuánto tarda con cada una y si van a domicilio, al hotel o al lugar del evento. Haz el itinerario hacia atrás desde la hora de la ceremonia o de las fotos para no ir con prisas.',
    'Para vestidos y trajes, toma en cuenta los tiempos de ajustes y, si rentas, las condiciones de entrega y devolución. En Planneo puedes ver los perfiles de belleza e imagen publicados y escribirles directo por WhatsApp para pedir disponibilidad y agendar tu prueba.',
  ],
  faqs: [
    {
      question: '¿Es necesaria la prueba de maquillaje y peinado?',
      answer:
        'No es obligatoria, pero es muy recomendable para bodas y XV años. Te permite ajustar el look, probar cómo se ve en fotos y saber cuánto tiempo necesitas el día del evento.',
    },
    {
      question: '¿Los maquilladores van a domicilio?',
      answer:
        'Muchos sí, a domicilio, hotel o al lugar del evento, a veces con un cargo por traslado. Pregúntalo al pedir la cotización junto con el número de personas a arreglar.',
    },
    {
      question: '¿Con cuánta anticipación debo apartar?',
      answer:
        'Los sábados de temporada alta se llenan pronto, sobre todo si necesitas un equipo para varias personas. En cuanto tengas fecha, escríbeles para confirmar disponibilidad.',
    },
  ],
}

export default belleza
