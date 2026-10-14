import { DRAFT_NOTE, type CategoryContent } from './types'

const fotoVideo: CategoryContent = {
  slug: 'foto-video',
  draft: true,
  authorNote: DRAFT_NOTE,
  editorialTitle: 'Cómo elegir tu foto y video en Monterrey',
  editorial: [
    'Las fotos y el video son lo único del evento que se queda contigo, así que vale la pena elegir con calma. Empieza por el estilo: hay fotógrafos más documentales, que capturan momentos sin posar; otros más editoriales o de retrato; y otros que combinan ambos. Revisa galerías completas de un mismo evento, no solo las mejores diez fotos, para ver cómo resuelven la luz de un salón, la noche en un jardín o una ceremonia en iglesia.',
    'Define qué necesitas cubrir: arreglo, ceremonia, sesión de pareja o familia, recepción y fiesta. Eso determina cuántas horas contratar y si conviene un segundo fotógrafo. Para video, pregunta si entregan un resumen corto, la película completa del evento o ambos, y si ofrecen same day edit para proyectar en la misma fiesta.',
    'Pregunta por los tiempos de entrega, el formato (galería en línea, memoria, álbum impreso), cuántas fotos editadas suelen entregar y si los archivos originales tienen costo extra. Si te interesa dron, confirma que el lugar lo permita y que el operador tenga experiencia volando en eventos.',
    'Las cabinas de fotos y las plataformas 360 son un servicio distinto: entretienen a los invitados y dejan recuerdos al momento. Funcionan bien en XV años, graduaciones y eventos corporativos, y suelen cotizarse por horas.',
    'Antes de contratar, platica con el fotógrafo o videógrafo: tienen que caerte bien, porque estarán contigo todo el día. En Planneo puedes ver los perfiles publicados de foto y video y escribirles directo por WhatsApp para revisar paquetes y disponibilidad.',
  ],
  faqs: [
    {
      question: '¿Cuántas horas de fotografía necesito para una boda?',
      answer:
        'Depende de qué momentos quieras cubrir. Si quieres desde el arreglo hasta el inicio de la fiesta, normalmente se necesitan más horas que si solo cubres ceremonia y recepción. Arma tu itinerario y compártelo con el fotógrafo para que te recomiende un paquete.',
    },
    {
      question: '¿Qué es un same day edit?',
      answer:
        'Es un video corto editado durante el mismo evento con lo grabado ese día, para proyectarlo antes de que termine la fiesta. Requiere un equipo dedicado, así que pregunta si está incluido o se cotiza aparte.',
    },
    {
      question: '¿En cuánto tiempo se entregan las fotos?',
      answer:
        'Cada proveedor maneja sus tiempos; muchos entregan un adelanto en pocos días y la galería completa algunas semanas después. Pide que el tiempo de entrega quede por escrito.',
    },
    {
      question: '¿Se puede usar dron en cualquier lugar?',
      answer:
        'No siempre. Algunos lugares o zonas tienen restricciones, y el clima o el viento pueden impedir el vuelo. Confírmalo con el lugar y con el operador antes del evento.',
    },
  ],
}

export default fotoVideo
