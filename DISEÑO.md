# Planneo — Diseño del Producto

> Documento de referencia de la idea general: qué se construye, para quién, y cómo funciona.
> La arquitectura técnica, base de datos y estructura de código la define el equipo de desarrollo.

---

## ¿Qué es Planneo?

Planneo es un **marketplace de servicios para eventos** enfocado en Monterrey y área metropolitana. Conecta a personas que organizan eventos (bodas, XV años, graduaciones, corporativos) con proveedores de servicios especializados.

**El problema que resuelve:**
Organizar un evento requiere contratar múltiples proveedores — fotógrafo, DJ, catering, decoración, salón — y hoy ese proceso es desorganizado: grupos de Facebook, recomendaciones boca a boca, perfiles de Instagram sin precios ni disponibilidad. Planneo centraliza eso.

---

## Personas (quiénes usan el sistema)

### 1. El Proveedor
Dueño de un negocio de servicios para eventos. Puede ser fotógrafo, DJ, salón de eventos, caterer, etc. Quiere aparecer en el catálogo, mostrar su trabajo, recibir consultas y cerrar contratos.

**Motivación:** Conseguir clientes sin depender solo de Instagram o recomendaciones.

### 2. El Usuario / Organizador del evento
Persona que está planeando un evento. Busca proveedores confiables, compara opciones, y contacta a quien le interesa.

**Motivación:** Encontrar proveedores con información clara: fotos reales, precios aproximados, disponibilidad, y poder contactarlos fácilmente.

### 3. El Admin (equipo Planneo — Gus y Eugenio)
Gestiona el catálogo, aprueba nuevos proveedores, importa datos y monitorea métricas.

**Motivación:** Crecer el catálogo, asegurar calidad de los perfiles, y dar seguimiento a proveedores.

---

## Categorías de proveedores

| Categoría | Slug |
|---|---|
| Fotografía / Video | `fotografia` |
| Belleza / Maquillaje | `belleza` |
| DJ / Música | `musica` |
| Banquete / Catering | `banquete` |
| Decoración | `decoracion` |
| Salones de Eventos | `salones` |

Cada categoría tiene su propia página de catálogo (`/fotografia`, `/salones`, etc.) con filtros específicos.

---

## Tipos de evento

Los proveedores indican para qué tipos de evento ofrecen sus servicios:

- **Bodas**
- **XV Años**
- **Corporativo**
- **Graduación**

---

## Estados de un proveedor

Un proveedor pasa por estos estados:

```
draft → pending → published
         ↓
       (rechazado)
```

| Estado | Significado | Visible en catálogo |
|---|---|---|
| `draft` | Creado por el admin, no activo | No |
| `pending` | Auto-registrado, esperando aprobación | No |
| `published` | Aprobado y activo | Sí |
| `claimed` | Perfil original reclamado por el dueño vía link | Sí |

---

## Roles de usuario

| Rol | Quién | Qué puede hacer |
|---|---|---|
| `admin` | Equipo Planneo | Gestión completa del catálogo y usuarios |
| `provider` | Proveedor aprobado | Gestionar su propio perfil, ver sus consultas |
| `provider_pending` | Proveedor en revisión | Completar su perfil mientras espera aprobación |

---

## Fase 1 — Panel del Proveedor

El objetivo de esta fase es que cualquier proveedor pueda **registrarse, configurar su perfil completo y gestionar su negocio** desde Planneo sin necesitar al equipo para cada paso.

---

### Flujo A: Auto-registro

El proveedor llega a Planneo y quiere aparecer en el catálogo.

**Pasos:**
1. Va a `/registrarme`
2. Llena un formulario con: nombre del negocio, categoría, nombre de contacto, email, contraseña, WhatsApp, zona, descripción breve
3. Recibe confirmación: "Revisaremos tu solicitud en 24–48 horas"
4. El equipo de Planneo recibe notificación por email
5. El admin revisa en `/admin/solicitudes` y aprueba o rechaza
6. El proveedor recibe email de aprobación con acceso a su panel

**Mientras espera aprobación:** puede entrar a `/panel` y completar su perfil (fotos, paquetes, etc.) aunque su perfil aún no sea público.

---

### Flujo B: Claim por link (flujo existente)

Cuando Gus contacta a un proveedor directamente (outbound).

**Pasos:**
1. Admin crea el perfil del proveedor en `/admin/proveedores`
2. Genera un link único de reclamación (`/reclamar/{token}`)
3. Manda el link al proveedor (WhatsApp, email)
4. El proveedor hace click, crea su cuenta, y queda vinculado a ese perfil
5. Redirige directo a `/panel`

---

### Panel del Proveedor — Secciones

El panel vive en `/panel` y es accesible solo para usuarios autenticados con rol `provider` o `provider_pending`.

#### `/panel` — Dashboard
Vista general con métricas rápidas:
- Visitas al perfil (últimos 7 días)
- Clicks en WhatsApp (últimos 7 días)
- Consultas nuevas sin leer
- Fotos subidas
- Paquetes configurados

Accesos rápidos a todas las secciones.

---

#### `/panel/perfil` — Información general

El proveedor edita toda la información de su negocio:
- Nombre del negocio
- Categoría (no editable — requiere admin)
- Descripción larga
- WhatsApp
- Email de contacto
- Instagram
- Zona de Monterrey donde opera
- Rango de precio: `$` Económico / `$$` Intermedio / `$$$` Premium
- Tipos de evento que atiende (checkboxes)

---

#### `/panel/fotos` — Galería de fotos

El proveedor gestiona su portafolio visual:
- Subir múltiples fotos a la vez
- Ver grid de fotos actuales
- Eliminar fotos
- Las fotos aparecen en su perfil público

**Restricciones:** Solo imágenes (JPEG, PNG, WebP). Tamaño máximo por foto: 10MB.

---

#### `/panel/media` — Audio y Video

Para proveedores que tienen contenido multimedia (músicos, DJ, videógrafos):
- Subir archivos de audio (MP3, WAV) con un título descriptivo
  - Ejemplo: "Mix de bodas 2025", "Ejemplo de saxofón en vivo"
- Subir clips de video (MP4) con título
- Ver lista de archivos subidos
- Reproducir audio directamente en el panel
- Eliminar archivos

**Restricciones:** Audio máx 50MB, Video máx 50MB.

---

#### `/panel/paquetes` — Servicios y precios

El proveedor define qué ofrece y a qué precio:

Cada paquete tiene:
- **Nombre** — "Paquete Silver", "Cobertura 6 horas"
- **Descripción** — texto libre
- **Precio desde / hasta** — rango en pesos MXN (puede dejarse vacío si no quiere publicar precio)
- **Unidad de precio** — Por evento / Por hora / Por persona
- **Incluye** — lista de items (una por línea)
- **Destacado** — si aparece primero en el perfil

Los paquetes se muestran en el perfil público del proveedor para que el usuario sepa qué esperar.

---

#### `/panel/menu` — Menú de catering *(solo categoría Banquete)*

Para proveedores de banquete/catering. Pueden crear múltiples menús:

Cada menú tiene:
- **Nombre** — "Menú Silver", "Menú Premium"
- **Descripción**
- **Precio por persona**
- **Mínimo de invitados**
- **Tipos de evento para los que aplica**
- **Platillos** organizados por tiempo: Entrada / Sopa / Plato principal / Postre / Bebidas / Extras

---

#### `/panel/salon` — Detalles del salón *(solo categoría Salones)*

Información específica del salón:
- Capacidad mínima y máxima de personas
- Dirección física
- Interior / Exterior / Ambos
- Estacionamiento propio
- Permite catering externo
- Amenidades disponibles (audio, iluminación, proyector, terraza, jardín, etc.)
- Plano del salón (imagen JPEG/PNG/WebP — el bucket de fotos no admite PDF)

---

#### `/panel/disponibilidad` — Calendario

El proveedor marca su disponibilidad:
- Vista de calendario mensual
- Click en una fecha para cambiar su estado:
  - **Disponible** (verde)
  - **Reservado** (rojo)
  - **Tentativo** (amarillo)
- Nota privada por fecha (solo la ve el proveedor)

En Fase 2 los usuarios podrán ver el calendario en readonly.

---

#### `/panel/consultas` — Buzón de contacto

Cuando los usuarios envíen consultas desde el perfil público (Fase 2), el proveedor las ve aquí:
- Lista de consultas con nombre, evento, fecha y mensaje
- Badge con número de consultas sin leer
- El proveedor puede marcar cada consulta como: Nueva / Leída / Respondida / Cerrada
- La consulta muestra: nombre, email, teléfono, tipo de evento, fecha del evento, número de invitados, mensaje

---

### Admin — Nuevas secciones

#### `/admin/solicitudes` — Solicitudes de registro

Lista de proveedores que se auto-registraron y están esperando aprobación.

Por cada solicitud se ve:
- Nombre del negocio
- Categoría
- Zona
- Email de contacto
- WhatsApp
- Descripción que escribieron
- Fecha de solicitud

Acciones disponibles:
- **Aprobar** → el perfil se publica, el rol cambia a `provider`, se le manda email de bienvenida
- **Rechazar** → el perfil queda inactivo, se le manda email de notificación

---

## Fase 2 — Carrito de Evento (Lado del Usuario)

> Decidido 2026-07-21. Estado previo: el formulario de cotización en perfil público,
> el hilo de cotización (`/consulta/{token}`) y las cuentas de cliente
> (`/crear-cuenta`, `/mis-consultas`) ya existen de la Fase 1 extendida.

### Concepto

El carrito es un **plan de evento**, no un checkout de e-commerce. El usuario arma
su evento eligiendo paquetes de varios proveedores (fotógrafo + DJ + salón + catering),
verifica qué fechas tienen libres, y al enviar se crea un **Evento** que genera una
solicitud de cotización a cada proveedor usando el sistema de hilos existente.
No hay pago en línea todavía — la negociación sigue en la cotización, y el pago y la
reservación en línea vendrán en una fase posterior sobre esta misma base.

### Perfil público — nuevas secciones

- **Paquetes visibles:** los `service_packages` del proveedor aparecen en su perfil
  (nombre, descripción, rango de precio, qué incluye), cada uno con botón
  **"Agregar a mi evento"**.
- **Calendario readonly:** el calendario de disponibilidad del proveedor se muestra
  en modo lectura: verde = disponible, rojo = reservado, amarillo = tentativo.
  Las notas privadas nunca se exponen.

### Reglas de disponibilidad contra la fecha del evento

La mayoría de los proveedores no mantendrá su calendario al día, así que la regla
no castiga la ausencia de datos:

| Estado del día | ¿Se puede agregar al carrito? | Etiqueta |
|---|---|---|
| `reservado` | ❌ No | "No disponible en tu fecha" |
| `disponible` | ✅ Sí | Badge verde "Disponible" |
| `tentativo` | ✅ Sí | "Por confirmar" |
| Sin marcar | ✅ Sí | "Por confirmar" |

### Flujo del carrito

1. El usuario define su evento (tipo, fecha, nº de invitados) — se le pide al
   agregar el primer paquete si aún no lo definió
2. Agrega paquetes de distintos proveedores; el carrito persiste en el navegador
   **sin necesidad de cuenta**
3. Al enviar, se le pide iniciar sesión o crear cuenta (flujo OTP existente)
4. Se crea el **Evento** y una solicitud de cotización por cada proveedor del carrito
5. Cada proveedor recibe su consulta en `/panel/consultas` como hasta ahora — con
   el paquete de interés ya indicado

### El Evento en /mis-consultas

`/mis-consultas` se convierte en un tablero por evento: el evento (nombre, tipo,
fecha, invitados) con el estado de cada proveedor — enviada / cotizada / confirmada —
y acceso al hilo de cada cotización. Las consultas sueltas (enviadas desde un perfil
sin carrito) siguen apareciendo como hasta ahora.

### Fuera de scope de esta fase

- Búsqueda/filtro por disponibilidad en el catálogo ("¿quién está libre el 15 de dic?")
- Pagos, anticipos y reservación en línea
- Reseñas y calificaciones
- Favoritos y notificaciones push

---

## Métricas clave del negocio

Las métricas que se rastrean para medir el crecimiento:

| Métrica | Cómo se mide |
|---|---|
| Visitas al perfil | Evento `profile_view` en tabla `leads` |
| Clicks en WhatsApp | Evento `whatsapp_click` en tabla `leads` |
| Consultas enviadas | Registros en tabla `inquiries` |
| Proveedores activos | `providers` con status `published` o `claimed` |
| Proveedores nuevos por semana | Registros en `providers` por `created_at` |

**Objetivo a 90 días:** 1,000 proveedores en el catálogo, 100+ leads totales, 10+ contratos cerrados.

---

## Zonas de Monterrey

El catálogo permite filtrar por zona. Las zonas actuales:

San Pedro Garza García · San Nicolás de los Garza · Guadalupe · Apodaca · Escobedo · Santa Catarina · Juárez · Monterrey Centro · Monterrey Sur · Monterrey Norte · García · Salinas Victoria
