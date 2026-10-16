# Planneo — Contexto completo del proyecto

> **Para:** Gus (co-fundador, lado del negocio) y su asistente de IA.
> **De:** Eugenio (co-fundador técnico / desarrollador).
> **Fecha:** 2026-07-21 · **Actualizado:** 2026-10-15 (alineado al MVP del brief del 14 ago 2026).
> **Propósito:** darle a tu Claude todo el contexto del producto y su estado real hoy,
> para que pueda ayudarte con estrategia, ventas, contenido y decisiones de negocio
> sin inventar cosas que no existen todavía.
> **Si algo aquí choca con `PLAN.md`, manda `PLAN.md`** (y el brief MVP manda sobre ambos).

---

## 1. ¿Qué es Planneo?

Planneo es un **directorio público de proveedores de eventos** en Monterrey y su
área metropolitana. Conecta a personas que organizan eventos (bodas, XV años,
graduaciones, eventos corporativos, cumpleaños) con proveedores especializados:
fotógrafos, DJs, salones, caterings, decoradores, maquillistas.

**El MVP en una frase:** el organizador navega sin cuenta, ve fotos, paquetes y
rango de precio, y le escribe al proveedor **directo por WhatsApp**. Planneo no
cobra, no intermedia y no ejecuta el evento.

**El problema:** organizar un evento hoy significa grupos de Facebook,
recomendaciones de boca en boca y perfiles de Instagram sin precios ni
disponibilidad. Planneo centraliza perfiles con fotos reales, paquetes, rango de
precio y calendario de disponibilidad, en páginas que Google indexa.

**Metas:**
- Hito 1 (30 sept 2026): directorio público con contenido real + auto-registro
  funcionando desde fuera.
- 31 oct 2026: 100 perfiles publicados · 30 clicks a WhatsApp · tráfico medible en GA4.
- *Histórico (jul 2026):* «1,000 proveedores en catálogo, 100+ leads, 10+
  contrataciones a 90 días».

**Dominio canónico:** `www.planneo.com.mx`.

## 2. Equipo

- **Eugenio Pedraza** — co-fundador técnico. Construye todo el producto.
- **Gus** — co-fundador de negocio. Consigue proveedores (outbound), hace sales
  calls mostrando perfiles en pantalla, carga proveedores vía el admin, y define
  las decisiones de producto del lado comercial.

## 3. Tecnología (resumen para no-técnicos)

Plataforma web propia (no un generador no-code) construida con Next.js 16 +
TypeScript + Supabase (base de datos, autenticación y archivos) + Resend (emails),
desplegada en Vercel. Se eligió stack propio para tener control total de SEO
(cada perfil de proveedor es una página indexable por Google), analítica y URLs
canónicas — eso es el motor de adquisición orgánica.

Lo que es Fase 2 no se borra: se apaga con **feature flags** (interruptores) que
por defecto están en OFF. Ver § 7.

## 4. Quiénes usan el sistema (roles)

| Rol | Quién | Qué hace |
|---|---|---|
| **Organizador / cliente** | Persona planeando un evento | Busca, compara y escribe por WhatsApp al proveedor. **No necesita cuenta** (en el MVP no hay cuentas de organizador). |
| **Proveedor** (`provider`) | Negocio de servicios aprobado | Gestiona su perfil completo desde su panel. Entra con **código de 6 dígitos al correo** (sin contraseña). |
| **Proveedor pendiente** (`provider_pending`) | Se auto-registró, espera aprobación | Puede completar su perfil mientras espera; no aparece en el catálogo. Aprobación manual en 24–48 hrs. |
| **Admin** (Gus y Eugenio) | Equipo Planneo | Gestión total: alta de proveedores, importar CSV, aprobar solicitudes, testimonios, métricas. Entra igual por código al correo. |

## 5. Catálogo

**Categorías:** 8 madres + «Otros servicios», cada una con su página indexable
(ej. `www.planneo.com.mx/musica`). Las subcategorías funcionan como filtro.

| Madre | URL |
|---|---|
| Lugares y salones | `/lugares` |
| Banquete y bebidas | `/banquete` |
| Música y entretenimiento | `/musica` |
| Foto y video | `/foto-video` |
| Decoración y ambientación | `/decoracion` |
| Mobiliario y equipo | `/mobiliario` |
| Belleza e imagen | `/belleza` |
| Invitaciones y detalles | `/invitaciones` |
| Otros servicios | `/otros` |

El árbol completo de subcategorías está en `PLAN.md` § «Árbol de categorías
objetivo». Las URLs viejas redirigen: `/fotografia` → `/foto-video`,
`/salones` → `/lugares`. «Otros» se gradúa a madre cuando una subcategoría junte
10+ proveedores. *Histórico:* hasta ago 2026 eran 6 categorías (Fotografía/Video,
Belleza, DJ/Música, Banquete, Decoración, Salones).

Cada página de categoría trae una guía editorial y preguntas frecuentes. Ese
texto es **borrador pendiente de revisión de Gus** (`content/categories/`).

**Tipos de evento:** Bodas, XV Años, Corporativo, Graduación, Cumpleaños,
Bautizos y familiares, Otro.

**Zonas (filtro):** San Pedro, San Nicolás, Guadalupe, Apodaca, Escobedo,
Santa Catarina, Juárez, Monterrey Centro/Sur/Norte, García, Salinas Victoria
(+ «Toda el área metropolitana»).

**Estados de un proveedor:** `draft` (creado por admin o importado por CSV,
oculto) → `pending` (auto-registrado, en revisión) → `published` (visible) /
`claimed` (reclamado por su dueño vía link, visible). Nada precargado se publica
sin el «sí» del proveedor.

## 6. Lo que YA está construido y funciona

### Catálogo público
- Homepage con buscador, catálogo completo en `/catalogo`, páginas por
  categoría con filtros (en celular, en un panel con conteo en vivo), y perfil de
  cada proveedor con SEO completo (sitemap, datos estructurados, Open Graph).
- Búsqueda de texto completo (`/buscar`) y filtro de fecha amable
  (`?fecha=YYYY-MM-DD`).
- **Perfil público:** fotos, descripción, zona, tipos de evento, rango
  `$ / $$ / $$$` (sin dato → «Precio a consultar»), paquetes, calendario de
  disponibilidad en modo lectura, badge Verificado y testimonios.
- **Contacto = botón de WhatsApp** en el perfil (abre `wa.me`, sin cuenta ni
  muro de login). Cada click se registra como evento `whatsapp_click`: es la
  **métrica norte** del MVP.
- **Testimonios:** solo los carga el admin, con consentimiento del proveedor y
  de quien opina. Sin estrellas ni calificaciones.
- Categorías sin proveedores muestran un estado vacío con CTA para escribirle a
  Planneo (WhatsApp de Planneo si está configurado; si no, correo).

### Dos formas de subir proveedores
1. **Outbound (flujo de Gus):** el admin crea el perfil en `/admin/proveedores`
   (a mano o importando CSV, que entra como `draft`), genera un **link de
   reclamación** único y se lo manda al proveedor por WhatsApp. El proveedor da
   click, confirma su correo con un código y queda dueño de su perfil.
2. **Auto-registro:** el proveedor entra a `/registrarme` (landing de captación
   en `/para-proveedores`), llena el formulario, confirma su correo con código y
   queda pendiente. El admin aprueba o rechaza desde `/admin/solicitudes` (con
   emails automáticos en cada paso).

### Acceso de proveedores y admins
- **Solo código de 6 dígitos al correo** (OTP), sin contraseñas. `/login` pide
  el correo y manda el código; `/recuperar` ya no existe (redirige a `/login`).

### Panel del proveedor
En `/panel`, el proveedor gestiona su perfil:
- **Dashboard** con métricas rápidas.
- **Perfil:** descripción, WhatsApp, Instagram, zona, rango de precio, tipos de evento.
- **Fotos:** galería con subida múltiple, reordenar, foto principal, eliminar.
- **Audio/Video:** para músicos y videógrafos (MP3, MP4, etc.) con reproductor.
- **Paquetes:** crear paquetes con precio (rango o fijo, por evento/hora/persona),
  lista de lo que incluye, destacados.
- **Menú de catering** (solo Banquete): menús con precio por persona, mínimo de
  invitados, y platillos organizados por tiempo.
- **Detalles del salón** (solo Lugares): capacidad, dirección,
  interior/exterior, estacionamiento, catering externo, amenidades, plano.
- **Disponibilidad:** calendario mensual; click en un día para marcarlo
  Disponible / Reservado / Tentativo, con nota privada.
- *Consultas y Agenda* siguen en el código pero son de Fase 2 (ver § 7).

### Admin
- CRUD de proveedores, importación por CSV, links de reclamación,
  solicitudes de registro (aprobar/rechazar), testimonios, y página de métricas.

## 7. Fase 2 (congelado, no se borra)

Por el brief MVP (14 ago 2026), todo esto se construyó entre junio y agosto pero
está **apagado con feature flags** hasta que el directorio esté público y con
tracción (arranque estimado 2027/2028, disparado por número de proveedores
activos). Nada se tira.

- **Cotización dentro de Planneo** *(congelado)*. La decisión original
  (jul 2026) era que la cotización viviera dentro de Planneo y no en WhatsApp,
  para más adelante ofrecer pago y reservación en línea. El brief la revirtió:
  en el MVP el contacto es WhatsApp directo. El flujo de hilos
  (`/consulta/{token}`), el buzón `/panel/consultas` y la Agenda siguen en el
  código; los hilos viejos siguen accesibles, pero no se pueden crear consultas
  nuevas.
- **Cuentas de organizador** (`/crear-cuenta`, `/mis-consultas`) *(congelado)*:
  responden 404. Antes de reactivarlas hay que pasarlas al acceso por código.
- **Carrito de Evento** *(congelado; Sprint 8 a medias, Sprint 9 sin empezar)*:
  el organizador armaba un plan con paquetes de varios proveedores y al enviar se
  creaba un Evento con una cotización por proveedor. La base de datos del envío
  quedó lista; la interfaz del carrito está apagada.
- **Asistente «Crear mi evento»** *(congelado)*.
- **Muro de WhatsApp** (pedir cuenta para ver el número) y **reseñas con
  estrellas**: no construidos; el MVP no los lleva.
- **Pagos, comisiones, anticipos, favoritos, notificaciones push, búsqueda por
  disponibilidad**: fuera.

Detalle técnico y cómo reactivar cada flag: `PLAN.md` § «Congelamiento Sprint 8».

## 8. Estado de producción

- La base de datos de producción ya tiene el schema del MVP (aplicado el
  4 sept 2026: 16 migraciones + las 8 madres y Otros). El prototipo de mayo quedó
  archivado aparte.
- Acceso por código al correo, catálogo en `/catalogo`, SEO, GA4 y WhatsApp ya
  están en `main` (lote PLA-5…PLA-38, oct 2026).

**Pendientes antes de dar por bueno el lanzamiento** (detalle en `PLAN.md`):
1. Plantillas de correo de Supabase en producción con el código (`{{ .Token }}`).
2. Variables en Vercel: dominio canónico `https://www.planneo.com.mx`, ID de GA4
   (Gus), WhatsApp propio de Planneo para categorías vacías (Gus).
3. SMTP con Resend en Supabase (el mailer integrado solo manda ~2 correos/hora).
4. Crear los usuarios admin (Gus y Eugenio).
5. Importar el CSV re-mapeado de proveedores de Gus (en `draft`).
6. Revisión de Gus al texto de las guías de categoría.
7. Auditoría manual del primer perfil publicado (PLA-37).

## 9. Preguntas abiertas para Gus (decisiones de negocio pendientes)

1. **Dominio del correo remitente:** hoy los correos salen de `hola@planneo.mx`.
   ¿Se queda así o pasa a `@planneo.com.mx`? El dominio elegido debe verificarse
   en Resend.
2. **Carga inicial:** el CSV de proveedores re-mapeado a las 8 madres + Otros.

*Ya decididas en el brief (no se re-debaten):* aprobación manual de
auto-registros en 24–48 hrs; en el perfil solo rangos de precio (sin dato →
«Precio a consultar»); sin reseñas, solo testimonios cargados por admin.

## 10. Métricas que el sistema ya rastrea

| Métrica | Fuente |
|---|---|
| Clicks en WhatsApp (**métrica norte**) | Evento `whatsapp_click` (GA4 + tabla `leads`) |
| Visitas al perfil | Evento `profile_view` |
| Tráfico | GA4 (requiere el ID configurado en Vercel) |
| Proveedores activos | Perfiles publicados/reclamados |
| Proveedores nuevos por semana | Fecha de alta |
| *Cotizaciones enviadas* | *Fase 2 — tabla de consultas, sin altas nuevas en el MVP* |

## 11. Mapa de rutas (referencia rápida)

**Público:** `/` · `/catalogo` (antes `/proveedores`, redirige) · `/[categoria]`
(ej. `/musica`) · `/[categoria]/[proveedor]` · `/buscar` · `/para-proveedores` ·
`/registrarme` · `/reclamar/{token}` · `/login` (solo código) · `/privacidad` ·
`/terminos`

**Proveedor:** `/panel` + perfil, fotos, media, paquetes, menú, salón,
disponibilidad

**Admin:** `/admin` + proveedores, solicitudes, métricas

**Fase 2 (congelado):** `/consulta/{token}` (hilos viejos), `/panel/consultas`,
`/panel/agenda`, `/crear-cuenta` y `/mis-consultas` (404), `/carrito` (no existe)

---

*Los documentos fuente en el repositorio son `DISEÑO.md` (comportamiento del
producto) y `PLAN.md` (plan técnico y sprints — el contrato entre negocio y
desarrollo: cualquier cambio de scope se actualiza ahí antes de codear).*
