# Planneo — Plan de Producto: Primera Versión Funcional

> **Audiencia:** Eugenio (dev) + Gus (negocio)
> **Última actualización:** 2026-09-04
> **Fuente de alcance:** Brief MVP Directorio (14 ago 2026). Si este archivo choca con el brief, manda el brief.
> **Contrato:** cualquier cambio de alcance se escribe aquí *antes* de codearse, y se avisa a Gus. Las decisiones de la § «Decisiones cerradas» no se re-debaten en código.

---

## Hito 1 — Checklist vivo

**El MVP en una frase:** un directorio público de proveedores de eventos en Monterrey, navegable sin cuenta. El organizador ve fotos, paquetes y rango de precio, y escribe por WhatsApp. Planneo no cobra, no intermedia y no ejecuta el evento.

**Lo único que cuenta hasta el 30 de septiembre:** `planneo.mx` vivo, público y con proveedores adentro.

Leyenda: ✅ hecho en código · 🔨 falta construir · 🔌 hay que apagar o reactivar · 🌐 infra / producción · 👤 Gus · ❄ congelado (Fase 2, no borrar)

Mergeado en `main` el 4 de septiembre 2026 (código). Falta aplicar las 3 migraciones SQL en Supabase (local + prod) para que WhatsApp leads, testimonios y el árbol nuevo existan en la base.

### Producto — entra en el MVP

| Bloque | Qué incluye | Estado |
|---|---|---|
| Catálogo público | Home, páginas por categoría, perfil, `/buscar`, sitemap, JSON-LD | ✅ Hecho. Redirects 301 `/fotografia` → `/foto-video`, `/salones` → `/lugares` |
| Perfil de proveedor | Fotos, descripción, zona, tipos de evento, rango `$ / $$ / $$$`, paquetes, calendario, badge Verificado, testimonios, WhatsApp | ✅ Hecho en código |
| Contacto | WhatsApp directo, sin cuenta, evento `whatsapp_click` | ✅ Código listo. 🌐 Aplicar migración `20260904000000_restaurar_whatsapp_click.sql` |
| Alta de proveedores | CSV + link de reclamación + auto-registro con aprobación manual | ✅ Hecho. CSV entra como `draft`. Política default: `manual_review` |
| Panel del proveedor | Perfil, fotos, media, paquetes, menú catering, salón, disponibilidad | ✅ Hecho. `/panel/consultas` y `/panel/agenda` siguen en código, gated |
| Admin | CRUD, importador CSV, solicitudes, métricas, testimonios, subcategoría | ✅ Hecho |
| Analítica | GA4: tráfico + `whatsapp_click` + `profile_view` | ✅ Eventos en código. 🌐 GA4 solo corre si existe `NEXT_PUBLIC_GA4_ID` en Vercel |
| Categorías | 8 madre + subcategorías + Otros, con páginas indexables | ✅ Código + redirects. 🌐 Aplicar `20260904020000_categorias_madre.sql` |

### Producto — se congela (feature flag OFF, no se elimina)

Flags en `src/lib/feature-flags.ts`. Unset o cualquier valor distinto de `on` = OFF. Hay que rebuild al cambiar `NEXT_PUBLIC_*`.

| Bloque | Estado |
|---|---|
| ❄ Carrito | ✅ UI apagada. `src/lib/cart.ts` y migración `events` se quedan. `NEXT_PUBLIC_FEATURE_CART=on` para reactivar |
| ❄ Cotización interna | ✅ Form público apagado; `createInquiry` rechaza altas nuevas. Hilos viejos y `/panel/consultas` siguen. `NEXT_PUBLIC_FEATURE_INQUIRIES=on` |
| ❄ Cuentas de organizador | ✅ `/crear-cuenta` y `/mis-consultas` responden 404 real (`notFound()`), ya no redirigen a home. `NEXT_PUBLIC_FEATURE_ORGANIZER_ACCOUNTS=on` |
| ❄ Muro de WhatsApp | ✅ OFF. El botón es público |
| ❄ Reseñas con estrellas | ✅ No construidas. Flag existe, no hay UI |
| ❄ Pagos / comisiones / anticipos | ✅ Ya fuera. Fase 2, 2027/2028 |
| ❄ Favoritos, push, búsqueda avanzada por disponibilidad | ✅ Ya fuera |

#### Congelamiento Sprint 8

Verificado el 13 oct 2026 (PLA-10): todo lo de Fase 2 sigue en el repo; nada se borró al congelar. Lo único que no existe como código es lo que nunca se construyó (muro de WhatsApp, reseñas, página `/carrito`).

**Hecho y conservado (apagado):**

- Carrito: `src/lib/cart.ts` (localStorage), drawer `src/components/event-cart.tsx`, «Agregar a mi evento» en `provider-packages-section.tsx`, migración `20260721010000_eventos_carrito.sql`.
- Cotización interna: formulario del perfil + `createInquiry` (rechaza altas con el flag OFF), hilo `/consulta/{token}`, bandeja `/panel/consultas`.
- Cuentas de organizador: `/crear-cuenta` (alta con contraseña, previa al modelo OTP) y `/mis-consultas`.

**Sigue accesible a propósito con los flags OFF:** `/consulta/{token}` y `/panel/consultas`, para que los hilos que ya existen no se pierdan. No se pueden crear consultas nuevas.

**Pendiente (no construir hasta que `planneo.mx` esté público):** ver Sprint 8 en § 6.4 — modal «define tu evento», página `/carrito` con validación de disponibilidad, gate de cuenta al enviar, Server Action evento + N inquiries + emails; Sprint 9 (tablero por evento). Antes de reactivar cuentas de organizador hay que pasar `/crear-cuenta` al modelo de código por correo: hoy todavía pide contraseña.

**Cómo reactivar** (Vercel o `.env.local`, valor exacto `on`, y volver a hacer build porque son `NEXT_PUBLIC_*`):

| Flag | Qué prende |
|---|---|
| `NEXT_PUBLIC_FEATURE_CART` | Drawer «Mi evento» en el navbar y «Agregar a mi evento» por paquete |
| `NEXT_PUBLIC_FEATURE_INQUIRIES` | Formulario público de cotización y altas nuevas de inquiries |
| `NEXT_PUBLIC_FEATURE_ORGANIZER_ACCOUNTS` | `/crear-cuenta`, `/mis-consultas` y sus enlaces en login/registro |
| `NEXT_PUBLIC_FEATURE_WHATSAPP_WALL` | Nada todavía: el flag existe pero no hay muro construido |
| `NEXT_PUBLIC_FEATURE_REVIEWS` | Nada todavía: reseñas no construidas (decisión 4.6) |

### Decisiones cerradas vs código

| # | Decisión | ¿El código la cumple? |
|---|---|---|
| 4.1 | Contacto = WhatsApp directo. Cotización interna congelada | ✅ Sí (flag inquiries OFF) |
| 4.2 | Solo rangos en el perfil. Sin dato → «Precio a consultar» | ✅ El perfil usa `$ / $$ / $$$` o «Precio a consultar». ⚠ Los paquetes sí muestran montos |
| 4.3 | Auto-registros: aprobación manual 24–48 hrs | ✅ Sí |
| 4.4 | Precargados sin reclamar no se publican solos | ✅ El CSV crea `draft` |
| 4.5 | Directorio híbrido: permiso verbal + admin | 👤 Operación, no código |
| 4.6 | Sin reseñas. Solo testimonios cargados por admin | ✅ Sí (migración testimonios pendiente en DB) |
| 4.7 | Sin muro de WhatsApp al lanzar | ✅ No hay muro. Cuentas de organizador apagadas |
| 4.8 | Paquetes y calendario se quedan en el perfil público | ✅ Sí, sin botón de carrito |
| 4.9 | Filtro de fecha amable | ✅ Catálogo: `?fecha=YYYY-MM-DD` |
| 4.10 | 8 madre + subcategorías + Otros | ✅ Código. 🌐 Migración SQL pendiente |
| 4.11 | Tráfico + clicks a WhatsApp | ✅ `whatsapp_click` en código. 🌐 GA4 + migración leads |
| 4.12 | Sprint 8 congelado | ✅ UI apagada, código conservado |

### Código alineado al brief

- [x] **WhatsApp en el perfil público** — `wa.me` + `whatsapp_click` (GA4 + `leads`)
- [x] **Apagar cotización pública** — flag; no se crean inquiries nuevas
- [x] **Apagar carrito en la UI** — navbar y «Agregar a mi evento»
- [x] **Apagar cuentas de organizador** — flag, no borrar
- [x] **Testimonios** — admin, hasta 6 citas, sin estrellas
- [x] **Migración de categorías 6 → 8 + Otros** — redirects 301; SQL pendiente de aplicar
- [x] **Filtro de fecha amable en el catálogo**
- [x] **Copy de precio vacío** — «Precio a consultar»
- [x] **Feature flags** — default OFF
- [x] **Documentar el freeze del Sprint 8**

Ojo menor: los paquetes publican precio exacto (el brief pide rangos en el *perfil*).

### Despliegue — Pedraza

Esto es lo que separa a Planneo de estar vivo. En orden.

**Infraestructura**

- [x] Proyecto Supabase y dominio `planneo.mx` (confirmado 4 sept 2026)
- [ ] Aplicar en prod (y local) las 3 migraciones nuevas: `whatsapp_click`, `testimonials`, `categorias_madre`
- [ ] Confirmar en Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_SITE_URL`
- [ ] SMTP con Resend en el dashboard de Supabase (el mailer integrado ~2 correos/hora)
- [ ] Confirmación de email activa + plantillas de `supabase/templates/` (`{{ .Token }}`, no el link)
- [ ] Crear usuarios admin (Gus y Eugenio): usuario en Supabase Auth con `app_metadata.role = admin`; entran por `/login` con código al correo, no necesitan contraseña

**Cambios de alcance del MVP** *(código en `main`; SQL de categorías/testimonios/leads pendiente)*

- [x] Feature flags en OFF (default)
- [x] WhatsApp de vuelta + `whatsapp_click` (código)
- [x] Migración de categorías + redirects (código; SQL pendiente)
- [x] Regla de disponibilidad amable en el filtro de fecha
- [x] Testimonios desde admin (código; SQL pendiente)
- [ ] Importar el CSV re-mapeado en modo oculto (`draft` / no published)
- [x] Congelar Sprint 8 documentado aquí

**Salida**

- [ ] QA desde fuera de la red: abrir `planneo.mx` en un celular con datos móviles y completar un auto-registro de proveedor de punta a punta
- [ ] GA4 verificando tráfico real

Detalle de Auth/SMTP: ver § 8 al final de este archivo.

### Pendientes de Gus

Los que bloquean contenido real en el directorio.

- [ ] Mandar `planneo_proveedores_curados.csv` (609) — brief dice listo desde el 3 de junio
- [ ] Re-mapear el CSV de 5 a 8 categorías con `categoria_original` (los 282 de `decoracion` esconden Lugares, Mobiliario, Decoración e Invitaciones; `EQ DE AUDIO Y VIDEO` va a Mobiliario, no a Música)
- [ ] Revisar `planneo_proveedores_revisar.csv` (230 filas sin clasificar)
- [ ] Sembrar Belleza: de 12 a 30+
- [ ] Fotos de portada por categoría (ahora 9, no 5)
- [ ] Outreach de permiso verbal — nada se publica sin un «sí»
- [ ] Juntar testimonios de proveedores que ya trabajaron eventos
- [ ] Llenar campos `[por definir]` en los 3 documentos legales + abogado en NL
- [ ] Copy y branding del sitio

### Fechas

| Fecha | Qué | Quién |
|---|---|---|
| 14 ago 2026 | CSV entregado + este brief | Gus |
| Semana del 18 ago | Junta de socios: alcance + Term Sheet | Ambos |
| **15 sept 2026** | `planneo.mx` desplegado y accesible desde fuera, aunque tenga pocos perfiles | Pedraza |
| **30 sept 2026** | Hito 1: directorio público con contenido real + auto-registro funcionando desde fuera | Ambos |
| 31 oct 2026 | 100 perfiles publicados · 30 clicks a WhatsApp · tráfico medible en GA4 | Ambos |

Ritmo: una junta semanal, día y hora fijos. Si un pendiente no se movió en dos semanas, se cambia el pendiente o se cambia el dueño.

### Árbol de categorías objetivo

Cada madre tiene página indexable (`planneo.mx/musica`). Las subcategorías son filtro/etiqueta. «Otros» se gradúa a madre cuando una subcategoría junte 10+ proveedores.

| # | Madre | Slug | Subcategorías |
|---|---|---|---|
| 1 | Lugares y salones | `lugares` | Salones · Jardines · Haciendas · Terrazas y roof gardens · Quintas · Casas de eventos |
| 2 | Banquete y bebidas | `banquete` | Catering · Taquizas y parrilladas · Pastelería y postres · Mesa de dulces · Barra y bartender · Meseros |
| 3 | Música y entretenimiento | `musica` | DJ · Grupo versátil · Banda · Mariachi · Solistas · Shows · Hora loca · Animación infantil · Edecanes |
| 4 | Foto y video | `foto-video` | Fotografía · Video · Cabina de fotos · 360 · Dron · Same day edit |
| 5 | Decoración y ambientación | `decoracion` | Floristería · Globos · Backdrops · Letras y números · Mantelería · Iluminación decorativa · Centros de mesa |
| 6 | Mobiliario y equipo | `mobiliario` | Sillas y mesas · Carpas · Pistas de baile · Audio e iluminación técnica · Pantallas · Planta de luz · Climatización · Sanitarios portátiles · Juegos e inflables |
| 7 | Belleza e imagen | `belleza` | Maquillaje · Peinado · Uñas · Spa · Vestidos y trajes · Renta de vestuario |
| 8 | Invitaciones y detalles | `invitaciones` | Invitaciones digitales e impresas · Imprenta · Diseño gráfico · Señalética · Recuerdos · Personalizados |
| + | Otros servicios | `otros` | Planeación y coordinación · Protocolo · Transporte y limusinas · Valet parking · Seguridad · Servicio médico · Niñeras |

### Después del MVP (para no construirlo ahora)

Fase 2 — Planneo completo, inicio 2027/2028, disparada por número de proveedores activos: se reactivan carrito y cotizaciones, se prenden reseñas y cuentas de organizador, y se cobra comisión. Nada de los sprints 6–8 se tira.

### Reglas para quien asiste el desarrollo

1. Este archivo es el contrato. El brief manda si hay contradicción.
2. No construir Fase 2 (carrito, cotizaciones, pagos, reseñas, favoritos) hasta que `planneo.mx` esté público.
3. No re-debatir las decisiones 4.1–4.12.
4. Preferir apagar sobre borrar.
5. Cada perfil es una página indexable. Sin muros de login, sin contenido solo-cliente, URLs canónicas y metadatos.
6. Nunca castigar la falta de datos: perfil sin fotos, sin precio o sin calendario se ve decente y sigue apareciendo.
7. Ante duda de negocio, preguntar a Gus.

---

## Historial de sprints (jun–jul 2026)

> Snapshot previo al brief. Lo vigente para construir está arriba. Sprint 8 queda **congelado** donde está.

## Estado actual — qué ya existe *(junio 2026)*

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

> **Cerradas por el Brief MVP (14 ago 2026).** No re-debatir. El texto de julio se conserva como historial: la cotización interna y el muro de WhatsApp quedan construidos y apagados.

1. **Categoría "Salones"** — ✅ Cerrado (4.10): madre «Lugares y salones», slug `lugares`.
2. **Aprobación de proveedores** — ✅ Cerrado (4.3): manual, compromiso 24–48 hrs, `/admin/solicitudes`.
3. **Paquetes con precio** — ✅ Cerrado (4.2): en el perfil solo rangos; sin dato → «Precio a consultar».
4. **Consultas (inquiries)** — ✅ Revertido (4.1): el contacto del MVP es WhatsApp directo. La cotización interna (`/consulta/{token}`, `/panel/consultas`) se congela con feature flag. Historial 2026-07-14: se había decidido cotizar dentro de Planneo y se quitó el botón de WhatsApp; eso se deshace para lanzar.
5. **Disponibilidad** — ✅ Cerrado (4.9): en el MVP el proveedor marca su calendario a mano. Filtro de fecha amable en el catálogo; nunca se castiga la falta de datos.

---

## 6. Fase 2 — Carrito de Evento (decidido 2026-07-21, congelado 2026-08-14)

> ❄ **Congelado.** No se construye más de esto hasta que `planneo.mx` esté público.
> Ver DISEÑO.md § "Fase 2 — Carrito de Evento" para el comportamiento de producto.
> Ya entregado y se apaga con flag: formulario de consulta público, hilo tokenizado,
> cuentas de cliente (`/crear-cuenta`, `/mis-consultas`), drawer «Mi evento».
> Fuera de alcance del MVP: reseñas, favoritos, pagos.

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

#### Sprint 6 — Cerrar Fase 1 (panel proveedor 100%) ✅ (2026-07-21)
- [x] `/panel/menu` — constructor de menús de catering (solo categoría banquete)
- [x] `/panel/salon` — form de venue_details (solo categoría salones, incl. plano como imagen)

#### Sprint 7 — Perfil público: paquetes + calendario ✅ (2026-07-21)
- [x] Sección de paquetes en `/[category]/[slug]` (datos ya públicos vía RLS)
- [x] Calendario readonly (vista `public_provider_availability`, sin notas privadas)
- [x] Botón "Agregar a mi evento" por paquete (carrito en localStorage, `src/lib/cart.ts`)

#### Sprint 8 — Carrito y envío ❄ CONGELADO (brief 4.12, 14 ago 2026)

No se termina ni se borra. Se apaga la UI hasta que `planneo.mx` esté público. Cómo reactivar: prender el feature flag de carrito, terminar `/carrito` + envío, y volver a exponer «Agregar a mi evento».

- [x] Migración: `events` + `inquiries.event_id` + `inquiries.package_id` + RLS (`supabase/migrations/20260721010000_eventos_carrito.sql`)
- [x] Persistencia en localStorage (`src/lib/cart.ts`) + drawer «Mi evento» (`src/components/event-cart.tsx`)
- [ ] Modal "define tu evento" al agregar el primer item
- [ ] Página `/carrito` con validación de disponibilidad por proveedor
- [ ] Gate de cuenta al enviar (login o `/crear-cuenta` con retorno al carrito)
- [ ] Server Action: crear evento + N inquiries + emails (cliente y proveedores)

#### Sprint 9 — Tablero de evento ❄ CONGELADO (misma Fase 2)
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

Acceso **solo por código al correo** (OTP de 6 dígitos, sin contraseña) para
proveedores y admins: `/registrarme` y `/reclamar/{token}` crean la cuenta con
`signInWithOtp` y la verifican en `/verificar-acceso`; `/login` usa el mismo
código con `shouldCreateUser: false`. `/recuperar` ya no existe (redirige 308 a
`/login`). Las cuentas viejas con contraseña (incluidos los admins) entran
igual con el código: Supabase les manda la plantilla "Magic Link". En local ya
está configurado (`supabase/config.toml` + `supabase/templates/`); en el
proyecto HOSTED hay que replicarlo a mano en el dashboard:

1. **SMTP personalizado** (Authentication > Emails > SMTP Settings): usar
   Resend como SMTP — host `smtp.resend.com`, puerto 465, user `resend`,
   pass = la API key de Resend, sender `hola@planneo.mx`. Sin esto, el mailer
   integrado de Supabase está limitado a ~2 correos/hora y no sirve para
   producción.
2. **Confirmaciones activas** (Authentication > Sign In / Providers > Email):
   habilitar "Confirm email". OTP expiration: 600 segundos.
3. **Plantillas** (Authentication > Emails > Templates): copiar
   `supabase/templates/confirmation.html` en "Confirm signup" y
   `supabase/templates/magic-link.html` en "Magic Link". Las dos deben mostrar
   `{{ .Token }}` (el código) en lugar del link; sin la de Magic Link, quien ya
   tiene cuenta (admins incluidos) no recibe código al iniciar sesión.

---

*Este documento es el contrato entre el equipo técnico y el equipo de negocio para la Fase 1. Cualquier cambio de scope debe actualizarse aquí antes de codear.*
