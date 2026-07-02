# Documentación completa de la plataforma

Guía técnica y funcional de la **plataforma de cotizaciones y pedidos** conectada
a World Office Cloud. Cubre qué hace, cómo funciona por dentro, qué puede hacer
cada rol, todos los casos de uso y **todas las variables de entorno**.

Documentos relacionados (no se repiten aquí):
- `MANUAL-ONBOARDING.md` — manual sencillo para personas no técnicas.
- `SETUP-SUPABASE.md` — puesta en marcha con base de datos y login reales.
- `INTEGRACION-WORLD-OFFICE.md` — plan y detalle de la conexión por API.

---

## Índice

1. [Qué es y qué resuelve](#1-qué-es-y-qué-resuelve)
2. [Arquitectura general](#2-arquitectura-general)
3. [Estructura del código](#3-estructura-del-código)
4. [Los dos modos: demo y producción](#4-los-dos-modos-demo-y-producción)
5. [Roles: qué hace y qué puede cada uno](#5-roles-qué-hace-y-qué-puede-cada-uno)
6. [Casos de uso (paso a paso)](#6-casos-de-uso-paso-a-paso)
7. [Cómo funciona por dentro](#7-cómo-funciona-por-dentro)
8. [Integración con World Office](#8-integración-con-world-office)
9. [Notificaciones por correo](#9-notificaciones-por-correo)
10. [Seguridad y control de acceso](#10-seguridad-y-control-de-acceso)
11. [Variables de entorno (todas)](#11-variables-de-entorno-todas)
12. [Comandos y scripts](#12-comandos-y-scripts)
13. [Credenciales de demostración](#13-credenciales-de-demostración)

---

## 1. Qué es y qué resuelve

Plataforma web **interna y cerrada** (no es tienda para clientes finales) donde
los vendedores de una empresa comercializadora arman cotizaciones y pedidos que
llegan **en tiempo real a World Office Cloud** (el sistema contable), listos para
facturar.

**Problema que resuelve:** hoy los pedidos se toman informalmente (WhatsApp,
fotos, audios), lo que genera errores y obliga a redigitar cada orden antes de
facturar. La plataforma elimina la redigitación: el pedido nace estructurado y
entra directo a World Office.

**Idea central:** el vendedor busca el producto **por descripción o por código**
(lo que le convenga), pero por debajo la plataforma **siempre conserva el código
contable**, que es la llave con la que el pedido entra correctamente a World
Office.

---

## 2. Arquitectura general

- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS. Base de datos y
  autenticación con Supabase (Postgres + Auth + RLS). Correo con Gmail API.
- **Patrón clave — contrato + implementaciones intercambiables.** Cada
  integración externa se esconde detrás de una interfaz, con una implementación
  de *demostración* y otra *real*, elegidas por variable de entorno. Se aplica en
  tres capas:

| Capa | Interfaz (contrato) | Demo | Producción | Se elige con |
|---|---|---|---|---|
| Datos | `Repositorio` | `RepositorioMemoria` | `RepositorioSupabase` | `DATA_MODE` |
| World Office | `ClienteWorldOffice` | `ClienteWorldOfficeMock` | `ClienteWorldOfficeLive` | `WORLDOFFICE_MODE` |
| Correo | `Notificador` | `NotificadorConsola` | `NotificadorGmail` | presencia de credenciales Gmail |

Ventaja: la plataforma funciona **completa** sin configurar nada (demo), y pasa a
producción **sin reescribir la app**, solo cambiando variables de entorno.

- **Dominio único de verdad.** Entidades y cálculos viven en `src/domain`. El
  frontend (previsualización) y el backend (persistencia y envío a World Office)
  usan **la misma fórmula**, así lo que ve el vendedor coincide con lo guardado y
  lo enviado.

---

## 3. Estructura del código

```
src/
  app/                     Rutas y paneles (un panel por rol)
    login/                 Inicio de sesión
    vendedor/              Panel del vendedor (Cotizador + historial)
    contable/              Panel contable (pedidos en vivo + facturar)
    admin/                 Panel administrador (usuarios, inventario, órdenes)
    api/
      ordenes/[id]/worldoffice/   Descarga la estructura WO de UNA orden
      worldoffice/estructuras/    Descarga en lote las estructuras de pedidos
  components/              UI reutilizable (buscador, tablas, badges, etc.)
  config/app.ts            Marca/identidad (nombre app y empresa) por entorno
  data/catalogo.ts         Catálogo de muestra (generado con IA)
  domain/
    tipos.ts               Entidades: Usuario, Producto, Cliente, Orden, LineaOrden
    calculos.ts            Totales, descuentos, IVA (módulo puro)
  lib/
    auth/sesion.ts         Sesión y guards por rol (demo cookie / Supabase Auth)
    datos/                 Repositorio (contrato + memoria + supabase)
    notificaciones/        Notificador (contrato + consola + gmail + plantilla)
    supabase/              Clientes Supabase (navegador, servidor, admin)
    roles.ts, formato.ts   Rutas por rol, formato de pesos/fechas
  worldoffice/             Integración World Office (contrato + mock + live + mapeo)
  middleware.ts            Refresca la sesión de Supabase (solo en modo supabase)
supabase/migrations/       Esquema SQL, RLS y secuencia de consecutivos
scripts/                   Generar seed del catálogo, sembrar Supabase
entregables/               Esta documentación y las guías
```

---

## 4. Los dos modos: demo y producción

### Modo demo (por defecto, `DATA_MODE=demo`)
- Datos **en memoria**, sembrados desde el catálogo y unos usuarios/clientes de
  ejemplo. Se reinician al reiniciar el servidor.
- Login por **cookie** validando contra los usuarios demo.
- World Office en **mock** (`WORLDOFFICE_MODE=mock`): simula respuestas.
- Correo a **consola** (imprime el mensaje) si no hay credenciales Gmail.
- Sirve para probar TODO el flujo sin configurar nada. Ideal para evaluación.

### Modo producción (`DATA_MODE=supabase`)
- Datos en **Postgres/Supabase**, persistentes.
- Login real con **correo + contraseña** (Supabase Auth).
- Acceso por rol garantizado por **RLS** en la base.
- World Office **live** al poner `WORLDOFFICE_MODE=live` + credenciales.
- Correo real por **Gmail** al poner sus credenciales.

Puesta en marcha detallada en `SETUP-SUPABASE.md`.

---

## 5. Roles: qué hace y qué puede cada uno

La plataforma tiene **tres roles**, cada uno con su panel. Al iniciar sesión, se
redirige al panel del rol; si se intenta entrar a otro panel, se redirige de
vuelta al propio (guard `requerirRol`).

### 5.1 Vendedor (`/vendedor`)
**Qué hace:** arma cotizaciones y pedidos para sus clientes.

Puede:
- **Buscar productos** por descripción **o** por código (no excluyente), con
  búsqueda en vivo (a medida que escribe).
- Ver la **disponibilidad en vivo** de cada producto (consultada a World Office).
- **Elegir el cliente** y armar líneas con cantidades.
- Ver el **descuento del cliente** aplicado automáticamente y el total en vivo
  (subtotal, descuento, IVA, total).
- **Guardar como cotización** (no toca World Office) o **generar pedido** (se crea
  en World Office en tiempo real y se avisa al área contable por correo).
- Consultar **su propio historial** de órdenes.

No puede: ver órdenes de otros vendedores, facturar, ni gestionar usuarios o
inventario.

### 5.2 Contable (`/contable`)
**Qué hace:** recibe los pedidos y los convierte en factura.

Puede:
- Ver **todos los pedidos en tiempo real**, ordenados por los más recientes.
- **Filtrar por vendedor**.
- Recibir **notificación por correo** cuando entra un pedido nuevo.
- **Convertir un pedido en factura** dentro de World Office con un clic.
- **Descargar la estructura** World Office de cada orden, y un **lote** con todas
  las estructuras de los pedidos pendientes.

No puede: crear cotizaciones/pedidos ni gestionar usuarios o inventario.

### 5.3 Administrador (`/admin`)
**Qué hace:** controla la plataforma para que la empresa no dependa de nadie
técnico.

Puede:
- **Crear y eliminar** vendedores y contables (no puede crear otros
  administradores desde el formulario, ni gestionarse a sí mismo).
- Ver **todas las órdenes** de todos.
- **Gestionar el inventario** (editar el stock de cada producto).
- Descargar estructuras World Office.

No puede: no tiene restricciones de negocio relevantes; es el control total.

---

## 6. Casos de uso (paso a paso)

### CU-1 · Iniciar sesión
1. El usuario entra a `/login`, escribe correo y contraseña.
2. La plataforma valida (cookie en demo, Supabase Auth en producción).
3. Redirige al panel según el rol.

### CU-2 · Buscar un producto (por descripción o código)
1. El vendedor escribe en el buscador (ej. `sello` o `0100178`).
2. Aparecen los resultados al instante; se muestra código, precio y
   **disponibilidad en vivo**.
3. El código contable queda asociado aunque haya buscado por descripción.

### CU-3 · Armar una cotización
1. El vendedor selecciona el **cliente**.
2. Agrega productos con cantidad; el **descuento del cliente** se aplica solo.
3. Ve subtotal, descuento, IVA y total actualizados en vivo.

### CU-4 · Guardar como cotización
1. Pulsa **Guardar cotización**. Queda en su historial en estado *cotización*.
2. No se envía nada a World Office.

### CU-5 · Generar un pedido
1. Pulsa **Generar pedido**.
2. La orden se guarda como *pedido* y se **crea en World Office** en tiempo real;
   se guarda el id del documento (`worldOfficeDocId`).
3. Se envía **correo al área contable**.
4. Si World Office fallara, el pedido queda guardado igual y se reintenta
   (idempotencia evita duplicados).

### CU-6 · Ver pedidos en tiempo real (contable)
1. El contable abre `/contable`; la vista se **autoactualiza**.
2. Puede **filtrar por vendedor**.

### CU-7 · Convertir pedido en factura
1. El contable pulsa **Convertir a factura** en un pedido.
2. La plataforma **edita ese mismo documento** en World Office a factura (sin
   duplicar) y marca la orden como *facturado*.

### CU-8 · Descargar estructuras World Office
1. Desde contable/admin: **Descargar estructura** de una orden (JSON), o
   **Descargar estructuras (lote)** de todos los pedidos pendientes.

### CU-9 · Crear un usuario (admin)
1. El admin llena nombre, correo, rol (vendedor/contable) y contraseña inicial.
2. En producción se crea la cuenta en Supabase Auth + su perfil con rol.

### CU-10 · Eliminar un usuario (admin)
1. El admin pulsa eliminar; la cuenta y su acceso se retiran.

### CU-11 · Editar inventario (admin)
1. El admin cambia el stock de un producto; se guarda al instante.

---

## 7. Cómo funciona por dentro

### 7.1 Cálculo de totales (una sola fórmula)
`src/domain/calculos.ts` define:
- `calcularTotalLinea` — por línea: `base = precio × cantidad`; se resta el
  descuento %, se suma el IVA %.
- `calcularTotales` — agrega subtotal, descuento total, IVA y total de la orden.

Lo usan **el panel** (previsualización en vivo) y **el repositorio** al guardar,
por lo que nunca hay discrepancias.

### 7.2 Snapshot de la línea
Al crear una orden, cada línea guarda una **foto** del producto (código,
descripción, precio, IVA) en ese momento. Cambios futuros en el catálogo no
alteran órdenes ya creadas.

### 7.3 Consecutivos
- Demo: contador en memoria.
- Producción: **secuencia de Postgres** (`siguiente_consecutivo`) → números
  únicos aunque varios vendedores creen pedidos a la vez. Prefijo `COT-` para
  cotización, `PED-` para pedido.

### 7.4 "Tiempo real"
- Demo: el panel contable se **autorrefresca** cada 8 s (`AutoActualizar`).
- Producción: se puede sustituir por **Supabase Realtime** (push) sin cambiar la
  interfaz del panel.

### 7.5 Estados de una orden
`cotizacion` → `pedido` → `facturado`. El contable solo ve `pedido` y
`facturado`; el vendedor ve las suyas en cualquier estado; el admin ve todo.

---

## 8. Integración con World Office

Tres operaciones, todas detrás del contrato `ClienteWorldOffice`:

1. **Consultar inventario** (`consultarInventario`) — disponibilidad en vivo para
   el buscador del vendedor.
2. **Crear pedido** (`crearPedido`) — al generar un pedido.
3. **Convertir en factura** (`convertirEnFactura`) — acción del contable; edita
   el documento del pedido para no duplicar.

En **demo** corre el mock; en **producción** el cliente live hace HTTP real a la
API de World Office (auth `Authorization: WO <token>`), con **timeout,
reintentos con backoff, respeto de `Retry-After` e idempotencia**.

El código contable (ej. `0100178`) se conserva siempre y es la llave para
resolver el `idInventario` real en World Office. Detalle completo, endpoints,
mapeo de datos y checklist de activación en `INTEGRACION-WORLD-OFFICE.md`.

**Estructuras descargables:** `construirPayloadWorldOffice` genera el JSON neutro
(legible) que también se descarga desde los paneles — el mismo builder que usa la
conexión en vivo, así lo que se ve es idéntico a lo que se enviará.

---

## 9. Notificaciones por correo

Cuando entra un **pedido nuevo**, el área contable recibe un correo con el
consecutivo, cliente, vendedor, total, líneas y un enlace al panel contable
(`src/lib/notificaciones/plantilla.ts`).

- **Demo:** `NotificadorConsola` imprime el correo en la consola del servidor.
- **Producción:** `NotificadorGmail` (nodemailer + OAuth2). Se activa **solo si**
  están las cuatro credenciales de Gmail; si no, cae a consola. No hay que tocar
  código.

Destinatario configurable con `NOTIFICACIONES_CONTABLE_TO`.

---

## 10. Seguridad y control de acceso

- **Plataforma cerrada:** nadie se registra solo; las cuentas las crea el
  administrador.
- **Guards por rol** en el servidor (`requerirRol`): cada panel exige su rol y
  redirige si no corresponde.
- **RLS en la base** (producción): aunque alguien llamara la API directamente, la
  base solo devuelve lo que el rol permite (el vendedor solo sus órdenes;
  contable y admin, todas). Ver `supabase/migrations/0002_rls.sql`.
- **Secretos solo en variables de entorno** (`.env.local`), nunca en el código ni
  en el repositorio. La `service_role` y el token de World Office se tratan como
  contraseñas.
- **Llamadas a APIs externas solo desde el servidor** (Server Actions / Route
  Handlers), nunca desde el navegador, para no exponer tokens.
- **Código genérico:** el nombre de la empresa y la marca se leen de variables
  (`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_EMPRESA_NOMBRE`); la misma plataforma
  sirve a otro cliente cambiando solo la configuración.

---

## 11. Variables de entorno (todas)

Se copian de `.env.example` a `.env.local` y se rellenan. Todo lo específico de la
empresa vive aquí, no en el código. **`.env.local` nunca se sube al repositorio.**

### Modo de datos y autenticación
| Variable | Para qué | Valor |
|---|---|---|
| `DATA_MODE` | Elige memoria+cookie o Postgres+Auth | `demo` \| `supabase` |

### Supabase (solo en modo `supabase`)
| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (navegador) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio, **secreta** (solo servidor; crea/elimina usuarios) |
| `SEED_ADMIN_EMAIL` | Correo del administrador inicial que crea el seed |
| `SEED_ADMIN_PASSWORD` | Contraseña de ese administrador |
| `SEED_ADMIN_NOMBRE` | Nombre del administrador (opcional) |

### World Office — conexión y auth
| Variable | Para qué | Ejemplo/def. |
|---|---|---|
| `WORLDOFFICE_MODE` | Mock (concurso) o live (producción) | `mock` \| `live` |
| `WORLDOFFICE_API_BASE_URL` | Base de la API | `https://api.worldoffice.cloud/api/v1` |
| `WORLDOFFICE_API_TOKEN` | Token JWT (header `Authorization: WO <token>`) | — |
| `WORLDOFFICE_EMPRESA_ID` | Etiqueta de empresa para el payload neutro (mock) | `EMPRESA-DEMO` |

### World Office — IDs de configuración contable (numéricos, cuenta real)
| Variable | Para qué |
|---|---|
| `WORLDOFFICE_ID_EMPRESA` | `idEmpresa` |
| `WORLDOFFICE_ID_TERCERO_INTERNO` | Vendedor/responsable en World Office |
| `WORLDOFFICE_ID_FORMA_PAGO` | `idFormaPago` |
| `WORLDOFFICE_ID_MONEDA` | `idMoneda` (ej. COP) |
| `WORLDOFFICE_ID_BODEGA` | `idBodega` |
| `WORLDOFFICE_DOCTIPO_FACTURA` | Código tipo documento factura (`FV`) |
| `WORLDOFFICE_DOCTIPO_PEDIDO` | Código tipo documento pedido (confirmar) |

### World Office — rutas (dejar vacías = usar por defecto)
| Variable | Ruta por defecto |
|---|---|
| `WORLDOFFICE_RUTA_DOCUMENTO_VENTA` | `/documentos/editarDocumentoVenta` |
| `WORLDOFFICE_RUTA_INVENTARIO` | `/inventario/listar` |
| `WORLDOFFICE_RUTA_TERCEROS` | `/terceros/buscar` |
| `WORLDOFFICE_RUTA_BUSCAR_DOCUMENTO` | `/documentos/buscarPorReferencia` |

### World Office — robustez de red
| Variable | Para qué | Def. |
|---|---|---|
| `WORLDOFFICE_TIMEOUT_MS` | Milisegundos antes de abortar una petición | `15000` |
| `WORLDOFFICE_MAX_REINTENTOS` | Reintentos ante 5xx/429/red | `3` |

### Gmail (notificación al área contable)
| Variable | Para qué |
|---|---|
| `GMAIL_SENDER` | Correo remitente de la empresa |
| `GMAIL_CLIENT_ID` | OAuth2 Client ID |
| `GMAIL_CLIENT_SECRET` | OAuth2 Client Secret |
| `GMAIL_REFRESH_TOKEN` | Refresh token con scope `gmail.send` |
| `NOTIFICACIONES_CONTABLE_TO` | Destinatario del aviso de pedido nuevo |

> Si falta cualquiera de las cuatro credenciales de Gmail, el correo cae a
> consola automáticamente (no rompe nada).

### Aplicación (marca/identidad)
| Variable | Para qué | Def. |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Nombre de la plataforma en la interfaz | `Cotizaciones y Pedidos` |
| `NEXT_PUBLIC_EMPRESA_NOMBRE` | Nombre de la empresa (documentos/payloads) | `La Empresa` |
| `APP_BASE_URL` | URL base (enlaces en correos) | `http://localhost:3000` |

---

## 12. Comandos y scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la plataforma en desarrollo (`http://localhost:3000`) |
| `npm run build` | Compila para producción |
| `npm run start` | Sirve la versión compilada |
| `npm run typecheck` | Verifica tipos (sin errores = listo) |
| `npm run seed:catalogo` | Regenera el seed SQL del catálogo desde `catalogo.ts` |
| `npm run seed:supabase` | Siembra Supabase: productos, clientes y admin inicial |

> No ejecutar `npm run build` con el `dev` corriendo (puede corromper `.next`).

---

## 13. Credenciales de demostración

Solo en modo demo (`DATA_MODE=demo`), sin datos reales:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@demo.com` | `admin123` |
| Contable | `contable@demo.com` | `contable123` |
| Vendedor 1 | `vendedor1@demo.com` | `vendedor123` |
| Vendedor 2 | `vendedor2@demo.com` | `vendedor123` |

(Hay dos vendedores para poder probar el filtro por vendedor del panel contable.)
En producción estas cuentas no existen: el administrador crea las reales.
