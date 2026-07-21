# Planneo — Plan de Producto: Primera Versión Funcional

> **Audiencia:** Eugenio (dev) + Gus (negocio)
> **Última actualización:** 2026-06-04
> **Estado actual del build:** ✅ 17 rutas, 0 errores TS

---

## Resumen ejecutivo (para Gus)

Tenemos el catálogo público y el panel de admin funcionando. Lo que viene ahora es darle a los proveedores su propio espacio: que puedan registrarse solos, subir sus fotos y audio, definir sus paquetes y precios, manejar su disponibilidad, y ver las consultas que les llegan. Esto convierte a Planneo de un directorio estático a una plataforma donde los proveedores tienen incentivo real de mantenerse activos.

**Lo que un proveedor va a poder hacer al terminar esta fase:**
- Registrarse desde una página pública (sin necesitar a Gus ni a Eugenio)
- Tener un perfil completo con fotos, audios (músicos), paquetes y precios
- Ver y responder consultas de clientes directamente en su panel
- Marcar su disponibilidad en un calendario
- Los salones tendrán campos especiales (capacidad, dirección, amenidades)
- Los caterers podrán construir su menú de platillos

---

## Estado actual — qué ya existe

| Módulo | Estado |
|---|---|
| Admin panel (CRUD proveedores, importar CSV) | ✅ Completo |
| Catálogo público (`/[category]`, `/[category]/[slug]`) | ✅ Completo |
| Búsqueda full-text | ✅ Completo |
| Claim flow (token → proveedor reclama perfil) | ✅ Completo |
| Panel proveedor básico (`/mi-perfil`) | ✅ Básico — edita desc, WhatsApp, IG, precio, eventos |
| Auth con roles `admin` / `provider` | ✅ Completo |
| Storage bucket `provider-photos` | ✅ Creado |
| SEO (sitemap, robots, JSON-LD) | ✅ Completo |

---

## Fase 1 — Panel Proveedor Completo

### Objetivo
Que cualquier proveedor pueda registrarse, configurar su perfil completo, y gestionar su negocio desde Planneo sin intervención del equipo.

---

## 1. Base de datos — cambios y nuevas tablas

### 1.1 Actualizar tabla `providers`

Agregar el estado `'pending'` para registros de auto-registro pendientes de aprobación.

```sql
-- Ampliar el check constraint de status
ALTER TABLE providers 
  DROP CONSTRAINT IF EXISTS providers_status_check;
ALTER TABLE providers 
  ADD CONSTRAINT providers_status_check 
  CHECK (status IN ('draft', 'pending', 'published', 'claimed'));
```

### 1.2 Nueva tabla: `service_packages`

Paquetes de servicio que un proveedor ofrece (aplica a todas las categorías).

```
service_packages
├── id               uuid PK
├── provider_id      uuid → providers(id)
├── name             text          "Paquete Silver", "Cobertura Básica"
├── description      text
├── price_from       numeric       precio mínimo
├── price_to         numeric       precio máximo (null si precio fijo)
├── price_unit       text          'por_evento' | 'por_hora' | 'por_persona'
├── includes         text[]        lista de lo que incluye
├── is_featured      boolean       destacar en el perfil público
├── sort_order       int
├── created_at       timestamptz
└── updated_at       timestamptz
```

**RLS:** El proveedor dueño puede leer/crear/editar/borrar sus propios paquetes. Público puede leer los de proveedores publicados.

### 1.3 Nueva tabla: `provider_media`

Archivos multimedia: fotos, audios (músicos), videos.

```
provider_media
├── id               uuid PK
├── provider_id      uuid → providers(id)
├── type             text    'photo' | 'audio' | 'video'
├── url              text    URL en Supabase Storage
├── title            text    nombre descriptivo (opcional)
├── sort_order       int     orden en galería
└── created_at       timestamptz
```

**Storage buckets necesarios:**
- `provider-photos` — ya existe (imágenes: JPEG/PNG/WebP, max 10MB)
- `provider-media` — nuevo (audio: MP3/WAV/M4A, max 50MB; video: MP4, max 200MB)

**RLS:** El proveedor dueño gestiona sus archivos. Público puede leer los de proveedores publicados.

### 1.4 Nueva tabla: `venue_details`

Campos extra para la categoría **Salones/Venues**. Relación 1-a-1 con `providers`.

```
venue_details
├── id               uuid PK
├── provider_id      uuid → providers(id) UNIQUE
├── capacity_min     int      personas mínimas
├── capacity_max     int      personas máximas
├── address          text     dirección completa
├── indoor           boolean
├── outdoor          boolean
├── parking          boolean
├── catering_allowed boolean  permiten catering externo
├── amenities        text[]   ['audio', 'iluminacion', 'proyector', 'terraza', ...]
├── floor_plan_url   text     URL del plano en Storage
├── created_at       timestamptz
└── updated_at       timestamptz
```

### 1.5 Nuevas tablas: `catering_menus` + `catering_menu_items`

Constructor de menú para proveedores de la categoría **Banquete/Catering**.

```
catering_menus
├── id               uuid PK
├── provider_id      uuid → providers(id)
├── name             text      "Menú Silver", "Menú Premium"
├── description      text
├── price_per_person numeric
├── min_guests       int
├── event_types      text[]    bodas, xv, corporativo...
├── created_at       timestamptz
└── updated_at       timestamptz

catering_menu_items
├── id               uuid PK
├── menu_id          uuid → catering_menus(id)
├── course           text      'entrada' | 'sopa' | 'plato_principal' | 'postre' | 'bebidas'
├── name             text      nombre del platillo
├── description      text
└── sort_order       int
```

### 1.6 Nueva tabla: `provider_availability`

Calendario de disponibilidad del proveedor.

```
provider_availability
├── id               uuid PK
├── provider_id      uuid → providers(id)
├── date             date
├── status           text    'available' | 'booked' | 'tentative'
├── note             text    (privado, solo el proveedor lo ve)
└── created_at       timestamptz
UNIQUE (provider_id, date)
```

### 1.7 Nueva tabla: `inquiries`

Buzón de consultas que los usuarios envían a los proveedores (Fase 2 lo usa desde el lado del usuario; en Fase 1 el proveedor puede verlas y gestionarlas).

```
inquiries
├── id               uuid PK
├── provider_id      uuid → providers(id)
├── name             text
├── email            text
├── phone            text
├── event_type       text
├── event_date       date
├── guest_count      int
├── message          text
├── status           text    'new' | 'read' | 'replied' | 'closed'
├── created_at       timestamptz
└── updated_at       timestamptz
```

**RLS:** El proveedor dueño puede leer/actualizar status de sus inquiries. Anon puede insertar.

---

## 2. Roles y autorización

### Estado actual
```
app_metadata.role = 'admin'     → acceso total al back-office
app_metadata.role = 'provider'  → puede editar su propio perfil
```

### Cambios necesarios

| Rol | Cuándo | Qué puede hacer |
|---|---|---|
| `provider_pending` | Recién registrado, esperando aprobación | Solo leer su propio registro (status: pending) |
| `provider` | Aprobado por admin | CRUD en sus propias tablas: media, packages, menus, availability, read inquiries |
| `admin` | Equipo interno | Todo — aprobar/rechazar pending, gestionar cualquier proveedor |

**Nota técnica:** Los roles viven en `auth.users.raw_app_meta_data.role`. Para cambiar un rol, se usa el `supabase.auth.admin.updateUserById()` con el service role key — operación solo ejecutable en Server Actions con `createAdminClient()`.

---

## 3. Nuevas rutas y páginas

### 3.1 Registro de proveedor (público)

| Ruta | Descripción |
|---|---|
| `/registrarme` | Formulario de auto-registro |
| `/registrarme/gracias` | Confirmación: "revisaremos tu solicitud en 24-48 hrs" |

**Flujo:**
1. Proveedor llena el form: nombre negocio, categoría, nombre contacto, email, WhatsApp, zona, descripción corta
2. Se crea auth user con `role: provider_pending` vía Supabase Auth (`signUp`)
3. Se crea registro en `providers` con `status: 'pending'`, `claimed_by: user.id`
4. Se envía email a `hola@planneo.mx` notificando la solicitud (Resend)
5. Redirect a `/registrarme/gracias`

### 3.2 Panel del proveedor (autenticado)

El grupo de rutas `(provider)` ya existe. Vamos a expandirlo:

```
/panel                          → Dashboard principal (reemplaza /mi-perfil)
/panel/perfil                   → Editar info general (nombre, desc, zona, precio, eventos)
/panel/fotos                    → Galería: subir, reordenar, eliminar
/panel/media                    → Archivos de audio/video (músicos, videógrafos)
/panel/paquetes                 → Crear/editar service packages
/panel/menu                     → Constructor de menú (solo categoría banquete)
/panel/salon                    → Detalles de salón (solo categoría venue)
/panel/disponibilidad           → Calendario de disponibilidad
/panel/consultas                → Buzón de inquiries
```

### 3.3 Admin — nuevas secciones

```
/admin/solicitudes              → Lista de proveedores pendientes de aprobación
/admin/solicitudes/[id]         → Detalle de solicitud + botón Aprobar/Rechazar
```

---

## 4. Sprints de implementación

### Sprint 1 — Base de datos y tipos (Semana 1)
**Responsable:** Eugenio

- [ ] Migración SQL: agregar `pending` al enum de status
- [ ] Migración SQL: crear `service_packages`, `provider_media`, `venue_details`
- [ ] Migración SQL: crear `catering_menus`, `catering_menu_items`
- [ ] Migración SQL: crear `provider_availability`, `inquiries`
- [ ] RLS policies para todas las tablas nuevas
- [ ] Nuevo bucket `provider-media` en Storage (audio/video)
- [ ] Actualizar `src/lib/types.ts` con todos los nuevos tipos
- [ ] Agregar categoría "Salones" al seed/categorías

### Sprint 2 — Auto-registro y aprobación admin (Semana 2)
**Responsable:** Eugenio | **Revisión:** Gus (UX del formulario)

- [ ] Página `/registrarme` con form completo
- [ ] Server Action: crear user `provider_pending` + registro `providers`
- [ ] Email de notificación a admin (Resend)
- [ ] Página `/registrarme/gracias`
- [ ] Admin: `/admin/solicitudes` — lista de pendientes
- [ ] Admin: Server Action aprobar (cambia role a `provider`, status a `published`)
- [ ] Admin: Server Action rechazar (cambia status a `rejected`, envía email al proveedor)
- [ ] Email al proveedor en aprobación (Resend)

### Sprint 3 — Panel proveedor: perfil + media (Semana 3)
**Responsable:** Eugenio | **Revisión:** Gus (flujo desde el punto de vista del proveedor)

- [ ] Nuevo layout `/panel` con sidebar de navegación
- [ ] `/panel` — dashboard con métricas (leads 7 días, consultas nuevas)
- [ ] `/panel/perfil` — editar toda la info general del proveedor
- [ ] `/panel/fotos` — upload múltiple, grid drag-to-reorder, delete (usando `provider_media`)
- [ ] `/panel/media` — subir archivos de audio/video con título descriptivo

### Sprint 4 — Paquetes, menús y detalles específicos (Semana 4)
**Responsable:** Eugenio

- [ ] `/panel/paquetes` — CRUD de service_packages con UI de tarjetas
- [ ] `/panel/menu` — constructor de menús para banquete (solo visible en esa categoría)
- [ ] `/panel/salon` — form de venue_details (solo visible en categoría Salones)

### Sprint 5 — Disponibilidad y consultas (Semana 5)
**Responsable:** Eugenio | **Definición:** Gus (¿qué ven los proveedores de una consulta?)

- [ ] `/panel/disponibilidad` — calendario mensual, click para cambiar status
- [ ] `/panel/consultas` — lista de inquiries con badge de nuevas
- [ ] Action: marcar inquiry como leída/respondida/cerrada
- [ ] Formulario de consulta en el perfil público (Fase 2 lo expone al usuario final)

---

## 5. Preguntas abiertas para Gus (decisiones de negocio)

Antes de codear ciertos detalles, necesitamos tu input:

1. **Categoría "Salones"** — ¿Cuál es el nombre exacto para el catálogo? ¿"Salones de eventos"? ¿"Venues"? ¿"Lugares"?

2. **Aprobación de proveedores** — ¿En cuánto tiempo se comprometen a aprobar? ¿24 hrs? ¿Tiene que ir Gus a verificar el negocio antes de aprobar, o se aprueba automáticamente por ahora?

3. **Paquetes con precio** — ¿Mostramos el precio exacto en el perfil público, o solo rangos? Algunos proveedores pueden no querer publicar precios.

4. **Consultas (inquiries)** — ✅ DECIDIDO (2026-07-14): la cotización se hace DENTRO de Planneo, no por WhatsApp. El cliente pide cotización desde el perfil público, el proveedor responde (con monto opcional) desde `/panel/consultas`, y el cliente ve/responde en `/consulta/{token}` (enlace tokenizado, sin cuenta). La plataforma proveerá pago y reservación más adelante, así que la conversación debe vivir aquí. Tabla `inquiry_messages` + `inquiries.access_token`.

   **Ampliado (2026-07-14):** el perfil público ya NO muestra botón de WhatsApp ni email directo — todo el contacto pasa por la solicitud de cotización. El proveedor puede **confirmar la reservación** de una consulta desde `/panel/consultas` (fija fecha y lugar del evento): la consulta pasa a estado `confirmed`, la fecha se bloquea como `booked` en `provider_availability`, y el evento aparece en la nueva sección `/panel/agenda` (quién, dónde y cuándo debe presentarse). El formulario público de cotización ahora captura el lugar del evento (`inquiries.event_location`). El cliente recibe email de confirmación con fecha y lugar.

5. **Disponibilidad** — ¿Solo el proveedor puede marcar días, o también los usuarios al agendar? Para Fase 1 recomendamos que solo el proveedor la gestione.

---

## 6. Fase 2 — Carrito de Evento (decidido 2026-07-21)

> Ver DISEÑO.md § "Fase 2 — Carrito de Evento" para el comportamiento de producto.
> Ya entregado de la lista original de Fase 2: formulario de consulta público,
> hilo de cotización tokenizado, cuentas de cliente (`/crear-cuenta`, `/mis-consultas`).
> Diferido: búsqueda por disponibilidad, reseñas, favoritos.

### 6.1 Decisiones (2026-07-21)

1. **Carrito = plan de evento → cotizaciones.** Al enviar se crea un Evento y una
   inquiry por proveedor vía el sistema existente. Sin pagos en esta fase.
2. **Item del carrito = paquete específico** (`service_packages`). Requiere exponer
   paquetes en el perfil público.
3. **Disponibilidad:** solo un día `booked` bloquea agregar al carrito para esa fecha.
   Sin marcar o `tentative` → "Por confirmar". Calendario readonly en perfil público.
4. **Cuenta:** carrito anónimo en localStorage; cuenta requerida al enviar (OTP existente).
5. **Evento:** nueva entidad que agrupa las cotizaciones; `/mis-consultas` = tablero.
6. **Seam:** el carrito vive en el cliente; el único punto de entrada nuevo al servidor
   es la Server Action de envío (crea evento + N inquiries reutilizando la lógica de
   `createInquiry`). El perfil público solo gana secciones de lectura.

### 6.2 Base de datos

```
events
├── id               uuid PK
├── client_user_id   uuid → auth.users(id)
├── name             text      "XV de Sofía" (opcional, default por tipo+fecha)
├── event_type       text      bodas | xv | corporativo | graduacion
├── event_date       date
├── guest_count      int
├── event_location   text
├── created_at       timestamptz
└── updated_at       timestamptz
```

- `inquiries.event_id` uuid nullable → `events(id)` (las consultas sueltas siguen con null)
- `inquiries.package_id` uuid nullable → `service_packages(id)` (paquete de interés)

**RLS:** el cliente dueño lee/crea sus eventos. El proveedor NO lee `events`
directamente — lo que necesita saber viaja en la inquiry. Admin todo.

### 6.3 Rutas

| Ruta | Descripción |
|---|---|
| `/[category]/[slug]` | + sección de paquetes con "Agregar a mi evento" + calendario readonly |
| `/carrito` | Ver/editar el plan: fecha, items, disponibilidad por proveedor, enviar |
| `/mis-consultas` | Tablero por evento (estado por proveedor) + consultas sueltas |

### 6.4 Sprints

#### Sprint 6 — Cerrar Fase 1 (panel proveedor 100%)
- [ ] `/panel/menu` — constructor de menús de catering (solo categoría banquete)
- [ ] `/panel/salon` — form de venue_details (solo categoría salones)

#### Sprint 7 — Perfil público: paquetes + calendario
- [ ] Sección de paquetes en `/[category]/[slug]` (datos ya públicos vía RLS)
- [ ] Calendario readonly (próximos meses; sin notas privadas)
- [ ] Botón "Agregar a mi evento" por paquete

#### Sprint 8 — Carrito y envío
- [ ] Migración: `events` + `inquiries.event_id` + `inquiries.package_id` + RLS
- [ ] Contexto de carrito + persistencia en localStorage
- [ ] Modal "define tu evento" al agregar el primer item
- [ ] Página `/carrito` con validación de disponibilidad por proveedor
- [ ] Gate de cuenta al enviar (login o `/crear-cuenta` con retorno al carrito)
- [ ] Server Action: crear evento + N inquiries + emails (cliente y proveedores)

#### Sprint 9 — Tablero de evento
- [ ] `/mis-consultas` agrupado por evento con estado por proveedor
- [ ] Link al hilo de cada cotización

### 6.5 Decisiones de testing

- Probar comportamiento externo, no implementación: RLS adversarial con scripts tipo
  `scripts/test-storage-security.mjs` (cliente A no lee eventos de cliente B; anon no
  lee `events`; proveedor no lee `events`)
- Server Action de envío: evento + N inquiries atómicos (si falla una inserción, no
  quedan inquiries huérfanas)
- E2E en navegador del flujo completo, como se ha venido haciendo en el panel

---

## 7. Variables de entorno pendientes

Asegurarse de que estén en `.env` y en Vercel antes de Sprint 2:

```
SUPABASE_SERVICE_ROLE_KEY    # necesario para aprobar/rechazar proveedores (cambiar roles)
RESEND_API_KEY               # emails de notificación y aprobación
NEXT_PUBLIC_GA4_ID           # analytics
NEXT_PUBLIC_SITE_URL         # para emails con links absolutos
```

## 8. Configuración de Supabase Auth en producción (checklist pre-lanzamiento)

La verificación de email por código de 6 dígitos (registro y recuperación de
contraseña) usa Supabase Auth nativo (`signUp` + `verifyOtp` /
`resetPasswordForEmail`). En local ya está configurado (`supabase/config.toml`
+ `supabase/templates/`); en el proyecto HOSTED hay que replicarlo a mano en
el dashboard:

1. **SMTP personalizado** (Authentication > Emails > SMTP Settings): usar
   Resend como SMTP — host `smtp.resend.com`, puerto 465, user `resend`,
   pass = la API key de Resend, sender `hola@planneo.mx`. Sin esto, el mailer
   integrado de Supabase está limitado a ~2 correos/hora y no sirve para
   producción.
2. **Confirmaciones activas** (Authentication > Sign In / Providers > Email):
   habilitar "Confirm email". OTP expiration: 600 segundos.
3. **Plantillas** (Authentication > Emails > Templates): copiar el contenido
   de `supabase/templates/confirmation.html` en "Confirm signup" y de
   `supabase/templates/recovery.html` en "Reset password". Lo importante es
   que muestren `{{ .Token }}` (el código) en lugar del link.

---

*Este documento es el contrato entre el equipo técnico y el equipo de negocio para la Fase 1. Cualquier cambio de scope debe actualizarse aquí antes de codear.*
