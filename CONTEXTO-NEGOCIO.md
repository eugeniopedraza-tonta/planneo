# Planneo — Contexto completo del proyecto

> **Para:** Gus (co-fundador, lado del negocio) y su asistente de IA.
> **De:** Eugenio (co-fundador técnico / desarrollador).
> **Fecha:** 2026-07-21.
> **Propósito:** darle a tu Claude todo el contexto del producto y su estado real hoy,
> para que pueda ayudarte con estrategia, ventas, contenido y decisiones de negocio
> sin inventar cosas que no existen todavía.

---

## 1. ¿Qué es Planneo?

Planneo es un **marketplace de servicios para eventos** enfocado en Monterrey y su
área metropolitana. Conecta a personas que organizan eventos (bodas, XV años,
graduaciones, eventos corporativos) con proveedores especializados: fotógrafos,
DJs, salones, caterings, decoradores, maquillistas.

**El problema:** organizar un evento hoy significa grupos de Facebook,
recomendaciones de boca en boca y perfiles de Instagram sin precios ni
disponibilidad. Planneo centraliza todo: perfiles con fotos reales, paquetes con
precios, calendario de disponibilidad y cotización dentro de la plataforma.

**Objetivo a 90 días:** 1,000 proveedores en catálogo, 100+ leads, 10+ contrataciones.

**Dominio previsto:** planneo.mx (aún no configurado en producción).

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

## 4. Quiénes usan el sistema (roles)

| Rol | Quién | Qué hace |
|---|---|---|
| **Organizador / cliente** | Persona planeando un evento | Busca, compara, arma su evento, pide cotizaciones. Solo necesita cuenta al enviar cotizaciones. |
| **Proveedor** (`provider`) | Negocio de servicios aprobado | Gestiona su perfil completo desde su panel. |
| **Proveedor pendiente** (`provider_pending`) | Se auto-registró, espera aprobación | Puede completar su perfil mientras espera; no aparece en el catálogo. |
| **Admin** (Gus y Eugenio) | Equipo Planneo | Gestión total: alta de proveedores, importar CSV, aprobar solicitudes, métricas. |

## 5. Catálogo

**Categorías:** Fotografía/Video, Belleza/Maquillaje, DJ/Música, Banquete/Catering,
Decoración, Salones de Eventos. Cada una con su página propia (ej. planneo.mx/fotografia).

**Tipos de evento:** Bodas, XV Años, Corporativo, Graduación.

**Zonas (filtro):** San Pedro, San Nicolás, Guadalupe, Apodaca, Escobedo,
Santa Catarina, Juárez, Monterrey Centro/Sur/Norte, García, Salinas Victoria.

**Estados de un proveedor:** `draft` (creado por admin, oculto) → `pending`
(auto-registrado, en revisión) → `published` (visible) / `claimed` (reclamado por
su dueño vía link, visible).

## 6. Lo que YA está construido y funciona

### Catálogo público
- Homepage, páginas por categoría con filtros, perfil de cada proveedor
  (fotos, descripción, zona, rango de precio) con SEO completo (sitemap, datos
  estructurados para Google).
- Búsqueda de texto completo (`/buscar`).
- **Perfil público con paquetes:** los paquetes del proveedor se muestran con
  nombre, descripción, rango de precio y qué incluyen, cada uno con botón
  **"Agregar a mi evento"** (el inicio del carrito).
- **Calendario de disponibilidad en modo lectura** en el perfil público
  (verde = disponible, rojo = reservado, amarillo = tentativo; las notas
  privadas del proveedor nunca se muestran).

### Dos formas de subir proveedores
1. **Outbound (flujo de Gus):** el admin crea el perfil en `/admin/proveedores`
   (a mano o importando CSV), genera un **link de reclamación** único y se lo
   manda al proveedor por WhatsApp. El proveedor da click, crea su cuenta y queda
   dueño de su perfil.
2. **Auto-registro:** el proveedor entra a `/registrarme`, llena el formulario y
   queda pendiente. El admin aprueba o rechaza desde `/admin/solicitudes`
   (con emails automáticos en cada paso).

### Panel del proveedor (100% completo)
En `/panel`, el proveedor gestiona todo su negocio:
- **Dashboard** con métricas rápidas.
- **Perfil:** descripción, WhatsApp, Instagram, zona, rango de precio, tipos de evento.
- **Fotos:** galería con subida múltiple, reordenar, foto principal, eliminar.
- **Audio/Video:** para músicos y videógrafos (MP3, MP4, etc.) con reproductor.
- **Paquetes:** crear paquetes con precio (rango o fijo, por evento/hora/persona),
  lista de lo que incluye, destacados.
- **Menú de catering** (solo categoría Banquete): menús con precio por persona,
  mínimo de invitados, y platillos organizados por tiempo (entrada, sopa, plato
  principal, postre, bebidas).
- **Detalles del salón** (solo categoría Salones): capacidad, dirección,
  interior/exterior, estacionamiento, catering externo, amenidades, plano.
- **Disponibilidad:** calendario mensual; click en un día para marcarlo
  Disponible / Reservado / Tentativo, con nota privada.
- **Consultas:** buzón de cotizaciones (ver siguiente sección).
- **Agenda:** eventos confirmados — quién, dónde y cuándo debe presentarse.

### Sistema de cotización (decisión de producto clave)
**La cotización vive DENTRO de Planneo, no en WhatsApp.** El perfil público ya no
muestra botón de WhatsApp ni email directo — todo el contacto pasa por el
formulario "Solicitar cotización". Razón: la plataforma va a ofrecer pago y
reservación en línea más adelante, y para eso la conversación tiene que vivir aquí.

Flujo:
1. El cliente pide cotización desde el perfil público (nombre, contacto, tipo de
   evento, fecha, lugar, invitados, mensaje).
2. El proveedor la ve en `/panel/consultas` y responde — con monto opcional de
   cotización.
3. El cliente ve y responde el hilo en un enlace privado (`/consulta/{token}`),
   sin necesidad de cuenta. Recibe emails con su enlace.
4. El proveedor puede **confirmar la reservación**: fija fecha y lugar, la fecha
   se bloquea automáticamente como "Reservado" en su calendario, y el evento
   aparece en su Agenda. El cliente recibe email de confirmación.

### Cuentas de cliente
- Registro en `/crear-cuenta` con verificación por código de 6 dígitos al email
  (OTP), login, y recuperación de contraseña.
- `/mis-consultas`: el cliente ve todas sus cotizaciones en un solo lugar.

### Admin
- CRUD de proveedores, importación por CSV, links de reclamación,
  solicitudes de registro (aprobar/rechazar), y página de métricas.

## 7. Fase actual: "Carrito de Evento" (en desarrollo AHORA)

**Concepto:** el carrito es un **plan de evento**, no un checkout de e-commerce.
El usuario arma su evento eligiendo paquetes de varios proveedores (fotógrafo +
DJ + salón + catering), y al enviar se crea un **Evento** que manda una solicitud
de cotización a cada proveedor por el sistema de hilos existente. **Sin pagos aún** —
la negociación sigue en la cotización; pago y reservación en línea vendrán después
sobre esta misma base.

**Decisiones ya tomadas (2026-07-21):**
1. Un item del carrito = un **paquete específico** de un proveedor.
2. **Regla de disponibilidad amable:** como la mayoría de los proveedores no
   mantendrá su calendario al día, solo un día marcado explícitamente como
   "Reservado" bloquea agregarlo para esa fecha. Día disponible = badge verde;
   tentativo o sin marcar = "Por confirmar". Nunca se castiga la falta de datos.
3. El carrito funciona **sin cuenta** (se guarda en el navegador); la cuenta se
   pide solo al enviar (con el flujo de código por email ya existente).
4. `/mis-consultas` se convierte en un tablero por evento: estado de cada
   proveedor (enviada / cotizada / confirmada) con acceso a cada hilo.

**Estado de los sprints de esta fase:**

| Sprint | Contenido | Estado |
|---|---|---|
| 6 | Cerrar panel proveedor (menú catering + salón) | ✅ Hecho (21 jul) |
| 7 | Perfil público con paquetes + calendario readonly + botón "Agregar a mi evento" | ✅ Hecho (21 jul) |
| 8 | Página `/carrito`, definición del evento, gate de cuenta al enviar, envío (crea evento + N cotizaciones + emails) | 🔨 **En curso** — la base de datos del envío ya está lista (creación atómica del evento con todas sus cotizaciones, validando disponibilidad); falta la interfaz del carrito |
| 9 | `/mis-consultas` como tablero por evento | ⏳ Pendiente |

**Fuera de scope de esta fase:** búsqueda por disponibilidad ("¿quién está libre
el 15 de diciembre?"), pagos/anticipos, reseñas, favoritos, notificaciones push.

## 8. Pendientes para lanzar a producción (importante)

El producto corre completo en el entorno local de desarrollo, pero **la base de
datos de producción (Supabase remoto) está desalineada**: tiene un schema
prototipo viejo que no corresponde al código. Antes de lanzar hay que:

1. Resetear/alinear el proyecto Supabase remoto con las migraciones actuales
   (o crear un proyecto nuevo).
2. Llenar credenciales pendientes: `SUPABASE_SERVICE_ROLE_KEY` (sin esto no
   funcionan registro ni aprobación de proveedores), `RESEND_API_KEY` (emails),
   `NEXT_PUBLIC_GA4_ID` (analytics).
3. Configurar en el dashboard de Supabase: SMTP con Resend (el mailer integrado
   solo manda ~2 correos/hora), confirmación de email activa, y las plantillas de
   código de verificación.
4. Configurar el dominio planneo.mx en Vercel.
5. Crear los usuarios admin (Gus y Eugenio).
6. Importar el CSV de proveedores de Gus.

## 9. Preguntas abiertas para Gus (decisiones de negocio pendientes)

1. **Aprobación de proveedores:** ¿compromiso de tiempo de respuesta (24 hrs)?
   ¿Verificación del negocio antes de aprobar, o aprobar directo por ahora?
2. **Precios públicos:** ¿precio exacto o solo rangos en el perfil? (Hoy el
   proveedor puede dejar el precio vacío → "Precio a consultar".)
3. **Carga inicial:** el CSV de proveedores para arrancar el catálogo.

## 10. Métricas que el sistema ya rastrea

| Métrica | Fuente |
|---|---|
| Visitas al perfil | Evento `profile_view` |
| Clicks en WhatsApp | Evento `whatsapp_click` (histórico; el CTA principal ahora es cotizar) |
| Cotizaciones enviadas | Tabla de consultas |
| Proveedores activos | Perfiles publicados/reclamados |
| Proveedores nuevos por semana | Fecha de alta |

## 11. Mapa de rutas (referencia rápida)

**Público:** `/` · `/[categoria]` (ej. `/fotografia`) · `/[categoria]/[proveedor]` ·
`/buscar` · `/registrarme` · `/crear-cuenta` · `/login` · `/consulta/{token}` ·
`/mis-consultas` · `/carrito` (próximamente)

**Proveedor:** `/panel` + perfil, fotos, media, paquetes, menú, salón,
disponibilidad, consultas, agenda

**Admin:** `/admin` + proveedores, solicitudes, métricas

---

*Los documentos fuente en el repositorio son `DISEÑO.md` (comportamiento del
producto) y `PLAN.md` (plan técnico y sprints — el contrato entre negocio y
desarrollo: cualquier cambio de scope se actualiza ahí antes de codear).*
