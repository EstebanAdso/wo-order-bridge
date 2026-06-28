# Plataforma de Cotizaciones y Pedidos

Plataforma web interna para que los vendedores coticen, apliquen descuentos y
generen pedidos que llegan en tiempo real a **World Office Cloud**, listos para
convertirse en factura.

> El código es genérico y reutilizable: la identidad de la empresa (nombre,
> correos, marca) se configura en `.env.local`, no en el código. Para usar la
> plataforma en otra empresa basta cambiar la configuración.

> Construida para el concurso descrito en `docs/`. La conexión en vivo con World
> Office (el 10% final) está aislada tras un contrato de cliente; durante el
> concurso corre el modo **mock**. Ver `docs/INTEGRACION-WORLD-OFFICE.md`.

## Stack

- **Next.js (App Router) + TypeScript** — frontend y backend.
- **Supabase** — Postgres, autenticación con 3 roles y tiempo real.
- **Tailwind CSS** — interfaz.
- **Capa World Office** — contrato + mock + stub live (`src/worldoffice/`).
- **Gmail API** — notificación al área contable.

## Roles y paneles

| Rol | Panel | Qué hace |
|---|---|---|
| Vendedor | `/vendedor` | Busca por descripción o código, cotiza, aplica descuentos, ve inventario y su historial. |
| Contable | `/contable` | Ve pedidos en tiempo real, filtra por vendedor, recibe correo, convierte a factura. |
| Administrador | `/admin` | Crea/elimina usuarios, ve todo lo creado y gestiona inventario. |

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env.local   # y rellenar valores reales

# 3. Base de datos (Supabase): ejecutar en el SQL Editor, en orden:
#    supabase/migrations/0001_inicial.sql
#    supabase/migrations/0002_rls.sql
#    npm run seed:catalogo   -> genera supabase/seed-catalogo.sql, luego ejecútalo

# 4. Desarrollo
npm run dev      # http://localhost:3000
```

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` / `npm start` | Build y arranque de producción. |
| `npm run typecheck` | Verifica tipos sin compilar. |
| `npm run seed:catalogo` | Regenera el seed SQL del catálogo desde `src/data/catalogo.ts`. |

## Estructura

Ver `CLAUDE.md` para las convenciones completas. Resumen:

```
src/
  app/         Paneles por rol (App Router)
  components/  UI reutilizable
  domain/      Tipos y cálculos del negocio (fuente única)
  data/        Catálogo de muestra (IA)
  lib/         Supabase, formato, roles
  worldoffice/ Integración World Office (contrato/mock/live/payload)
supabase/      Migraciones y seed
docs/          Concurso, plan de integración y manual de onboarding
```

## Convención de commits

Cada commit empieza con un **emoji + tipo + descripción** en minúscula y en
imperativo. Formato:

```
<emoji> <tipo>: descripción breve
```

| Emoji | Tipo | Cuándo usarlo |
|---|---|---|
| 🚀 | `feat` | Nueva funcionalidad para el usuario. |
| 🐛 | `fix` | Corrección de un error. |
| ♻️ | `refactor` | Cambio de código que no altera el comportamiento. |
| 🎨 | `style` | Formato, estilos, UI sin cambio de lógica. |
| 📝 | `docs` | Documentación (README, comentarios, manual). |
| ✅ | `test` | Añadir o ajustar pruebas. |
| 🔧 | `chore` | Configuración, dependencias, tareas de mantenimiento. |
| ⚡ | `perf` | Mejora de rendimiento. |
| 🔒 | `security` | Cambios de seguridad. |

Ejemplos:

```
🚀 feat: panel del vendedor con búsqueda por código o descripción
🐛 fix: corregir cálculo de IVA en líneas con descuento
📝 docs: agregar manual de onboarding
🔧 chore: actualizar dependencias de Next.js
```

## Seguridad

- Todos los secretos viven en `.env.local` (ignorado por git). La plantilla es
  `.env.example`.
- El acceso por rol se aplica con Row Level Security en Supabase
  (`supabase/migrations/0002_rls.sql`).
