import { DRAFT_NOTE, type CategoryContent } from './types'

const lugares: CategoryContent = {
  slug: 'lugares',
  draft: true,
  authorNote: DRAFT_NOTE,
  editorialTitle: 'Cómo elegir tu lugar o salón en Monterrey',
  editorial: [
    'El lugar es casi siempre la primera decisión y la que acomoda todas las demás: define la fecha, cuántos invitados caben, qué tan formal se siente el evento y qué proveedores puedes traer. Antes de enamorarte de unas fotos, ten claros tres datos: fecha (o un par de opciones), número aproximado de invitados y presupuesto total del evento.',
    'En Monterrey el clima pesa más de lo que parece. Entre mayo y septiembre el calor hace que un jardín al mediodía sea muy distinto a uno de noche, y en temporada de lluvias conviene preguntar si hay techo, carpa o un plan B bajo cubierto. Un salón cerrado da más control; una hacienda, quinta o terraza da más ambiente, pero pide revisar sombra, ventilación y planta de luz.',
    'La ubicación también cuenta. Un lugar sobre Carretera Nacional, en Santiago o en García puede quedar a más de media hora de donde vive la mayoría de tus invitados. Piensa en el regreso de noche, en el estacionamiento o valet, y en si hay hoteles cerca para quien viene de fuera.',
    'Cuando hables con el lugar, pregunta qué incluye la renta: mobiliario, mantelería, meseros, horas de evento, limpieza, seguridad. Pregunta también si exigen proveedores de su lista (banquete, bebidas, audio) o si puedes traer los tuyos, si cobran descorche y a qué hora debe terminar la música. Esas condiciones cambian mucho el costo final.',
    'Visita el lugar a la misma hora en la que será tu evento, revisa baños, accesos y la zona de carga para proveedores. Pide por escrito lo acordado y las condiciones de anticipo y cancelación. En Planneo puedes ver los lugares publicados y escribirles directo por WhatsApp para resolver dudas y agendar una visita.',
  ],
  faqs: [
    {
      question: '¿Con cuánta anticipación conviene apartar un salón en Monterrey?',
      answer:
        'Depende de la fecha. Los sábados de temporada alta (primavera, otoño y diciembre) suelen apartarse con varios meses de anticipación, sobre todo para bodas. Si tu fecha es flexible o es entre semana, el margen es más amplio. Lo más seguro es preguntar disponibilidad directamente al lugar en cuanto tengas fecha tentativa.',
    },
    {
      question: '¿Qué suele incluir la renta de un lugar para eventos?',
      answer:
        'Varía mucho: algunos lugares rentan solo el espacio y otros incluyen mobiliario, mantelería, meseros, banquete o audio. Pide una lista por escrito de lo que incluye, las horas de evento, el costo por hora extra y si hay proveedores obligatorios.',
    },
    {
      question: '¿Puedo llevar mis propios proveedores?',
      answer:
        'Algunos lugares lo permiten sin problema, otros cobran una cuota por proveedor externo o descorche, y otros solo aceptan su propia lista. Pregúntalo antes de apartar, porque cambia tanto el presupuesto como tus opciones de banquete, bebidas y música.',
    },
    {
      question: '¿Cómo contacto a un lugar desde Planneo?',
      answer:
        'En el perfil de cada lugar publicado encontrarás un botón de WhatsApp para escribirle directamente. La cotización, la visita y el apartado se acuerdan con el lugar.',
    },
  ],
}

export default lugares
