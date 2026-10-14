import { DRAFT_NOTE, type CategoryContent } from './types'

const musica: CategoryContent = {
  slug: 'musica',
  draft: true,
  authorNote: DRAFT_NOTE,
  editorialTitle: 'Cómo elegir tu música y entretenimiento en Monterrey',
  editorial: [
    'La música marca el ritmo de toda la noche: la entrada, la cena, el primer baile y la pista llena a las dos de la mañana. Antes de contratar, piensa en tus invitados. Una boda con tres generaciones necesita a alguien que sepa pasar de lo romántico a la cumbia, al rock en español y al reguetón sin vaciar la pista.',
    'En Monterrey lo más común es combinar: un DJ que cubre la mayor parte del evento y un grupo versátil, banda, mariachi o solista para un momento especial. Si tu presupuesto es ajustado, un buen DJ con audio e iluminación decentes rinde mucho; si quieres un show en vivo, pregunta cuántos músicos son, cuántos sets tocan y cuánto dura cada uno.',
    'Pregunta qué incluye el servicio: equipo de audio, micrófonos para brindis y ceremonia, iluminación de pista, pantalla, operador y horas de música. Confirma si el lugar tiene restricciones de volumen u horario, si exige un proveedor de audio propio y qué necesitan los músicos en sitio (contactos eléctricos, espacio para montar, camerino).',
    'Pide videos recientes de eventos reales, no solo de estudio, y si es posible pregunta por referencias de clientes. Comparte tu lista de canciones imprescindibles y las que no quieres escuchar; un buen proveedor la toma en cuenta y lee a la pista sobre la marcha.',
    'La hora loca, la animación infantil o los shows especiales suelen cotizarse aparte. Revisa los proveedores de música publicados en Planneo y escríbeles directo por WhatsApp para confirmar disponibilidad en tu fecha.',
  ],
  faqs: [
    {
      question: '¿DJ o grupo en vivo para una boda en Monterrey?',
      answer:
        'Muchas parejas combinan ambos: DJ para casi toda la noche y un grupo versátil, banda o mariachi para un bloque especial. El DJ da más variedad y continuidad; la música en vivo da energía y momentos memorables. Decide según el ambiente que buscas y tu presupuesto.',
    },
    {
      question: '¿Qué debe incluir la cotización de un DJ?',
      answer:
        'Horas de servicio, equipo de audio, micrófonos, iluminación de pista, montaje y desmontaje, y el costo por hora extra. Pregunta también si cubre ceremonia o cóctel en otro espacio del lugar.',
    },
    {
      question: '¿Cuánto dura una hora loca?',
      answer:
        'Suele ser un bloque de entre media hora y una hora, con animadores, accesorios y música de alta energía. Cada proveedor arma su paquete, así que confirma duración, número de animadores y qué artículos incluye.',
    },
    {
      question: '¿Con cuánta anticipación debo contratar la música?',
      answer:
        'Los proveedores más buscados se llenan rápido en sábados de temporada alta. En cuanto tengas fecha y lugar, escríbeles para confirmar disponibilidad.',
    },
  ],
}

export default musica
