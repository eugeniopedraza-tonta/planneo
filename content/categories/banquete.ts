import { DRAFT_NOTE, type CategoryContent } from './types'

const banquete: CategoryContent = {
  slug: 'banquete',
  draft: true,
  authorNote: DRAFT_NOTE,
  editorialTitle: 'Cómo elegir tu banquete y bebidas en Monterrey',
  editorial: [
    'La comida es de lo que más se acuerdan los invitados, y también una de las partidas más grandes del presupuesto. Antes de pedir cotizaciones, define el formato: cena servida a tres tiempos, buffet, estaciones, taquiza o parrillada. En Monterrey una buena taquiza o un corte a la parrilla son tan bien recibidos como una cena formal; lo importante es que vaya con el tono del evento.',
    'Ten a la mano el número de invitados, el horario y el lugar. El precio casi siempre se calcula por persona, y cambia según cuántos tiempos sirvas, si incluye meseros, loza, cristalería y mantelería, y si el proveedor cocina en sitio o llega con todo preparado. Pregunta si el lugar tiene cocina o si el banquete debe traer su propio equipo.',
    'Pide una degustación antes de firmar; muchos proveedores la ofrecen con cita. Es el momento para ajustar porciones, sazón y presentación, y para preguntar por opciones vegetarianas, menú infantil o alergias de tus invitados.',
    'Las bebidas merecen su propia conversación. Define si habrá barra libre, cuántas horas, qué incluye (cerveza, destilados, coctelería, refrescos y hielo) y quién la atiende. Si el lugar cobra descorche, súmalo a la cuenta antes de comparar. El postre, el pastel y la mesa de dulces suelen ser proveedores aparte, así que conviene coordinarlos para que no se repitan.',
    'Por último, confirma tiempos: a qué hora llegan a montar, cuánto tarda el servicio y cuántos meseros habrá por mesa. En Planneo puedes revisar los proveedores de banquete publicados y escribirles directo por WhatsApp para pedir menú, cotización y fechas de degustación.',
  ],
  faqs: [
    {
      question: '¿Cómo se cotiza un banquete para un evento?',
      answer:
        'Normalmente por persona, según el menú, el número de tiempos y el servicio incluido (meseros, loza, mantelería). Comparte con el proveedor el número de invitados, la fecha, el lugar y el formato que buscas para que la cotización sea comparable.',
    },
    {
      question: '¿Conviene una taquiza o una cena formal?',
      answer:
        'Depende del estilo del evento y del presupuesto. La taquiza y la parrillada funcionan muy bien en eventos relajados y suelen ser más flexibles; la cena servida da un ambiente más formal y un ritmo más controlado. Ambas opciones son muy comunes en Monterrey.',
    },
    {
      question: '¿Las bebidas y el pastel van incluidos en el banquete?',
      answer:
        'A veces sí y a veces no. Hay proveedores que ofrecen paquete con barra y postre, y otros que solo hacen la comida. Pregunta exactamente qué incluye y, si el lugar cobra descorche, tómalo en cuenta al comparar.',
    },
    {
      question: '¿Puedo pedir una degustación?',
      answer:
        'Muchos proveedores de banquete ofrecen degustación con cita, a veces con costo que se descuenta si contratas. Pregúntalo directamente por WhatsApp desde su perfil en Planneo.',
    },
  ],
}

export default banquete
