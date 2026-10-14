import { DRAFT_NOTE, type CategoryContent } from './types'

const decoracion: CategoryContent = {
  slug: 'decoracion',
  draft: true,
  authorNote: DRAFT_NOTE,
  editorialTitle: 'Cómo elegir tu decoración y ambientación en Monterrey',
  editorial: [
    'La decoración es lo que convierte un salón o un jardín en tu evento. Antes de buscar proveedores, junta referencias: fotos de eventos que te gusten, una paleta de colores y dos o tres palabras que describan el ambiente (romántico, minimalista, campestre, moderno). Con eso cualquier decorador puede darte una propuesta concreta en lugar de una lista genérica.',
    'Conoce bien el lugar antes de decidir. Un salón con techos altos pide elementos con altura o iluminación colgante; un jardín ya tiene mucho verde y quizá solo necesite flores en mesas y un buen backdrop; una terraza de noche depende casi por completo de la iluminación decorativa. Pregunta al lugar qué está permitido: algunos no aceptan velas abiertas, confeti o fijar cosas en muros.',
    'En Monterrey es común contratar por separado floristería, globos, letras gigantes, mantelería, centros de mesa e iluminación. Un decorador integral puede coordinarlo todo; contratar por partes da más control, pero exige más coordinación de tu lado. Define desde el inicio quién monta, a qué hora y quién recoge al final.',
    'Pregunta qué piezas son en renta y cuáles te quedas, si las flores son naturales o artificiales y qué tan resistentes son al calor si el evento es al aire libre. Pide un render o una mesa de prueba si el proveedor lo ofrece, sobre todo para centros de mesa.',
    'Prioriza lo que más se ve y más se fotografía: la entrada, el backdrop, la mesa principal y los centros de mesa. En Planneo puedes ver los proveedores de decoración publicados y escribirles directo por WhatsApp para mandarles tus referencias.',
  ],
  faqs: [
    {
      question: '¿Qué necesito para pedir una cotización de decoración?',
      answer:
        'Fecha, lugar, número de mesas o invitados, paleta de colores y fotos de referencia. Mientras más concreto seas, más fácil es comparar propuestas entre decoradores.',
    },
    {
      question: '¿Conviene contratar un decorador integral o por partes?',
      answer:
        'Un decorador integral simplifica la coordinación y cuida que todo combine. Contratar por partes (flores, globos, iluminación, mantelería) da más control sobre cada detalle, pero te toca coordinar horarios y montaje entre proveedores.',
    },
    {
      question: '¿Las flores naturales aguantan un evento al aire libre en verano?',
      answer:
        'Algunas variedades resisten mejor el calor que otras. Pregunta al florista qué flores recomienda para la temporada y cuánto tiempo antes las montará.',
    },
  ],
}

export default decoracion
