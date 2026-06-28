---
name: crear-funcionalidad
description: Guía para añadir una funcionalidad nueva a la plataforma de cotizaciones y pedidos siguiendo su arquitectura (Next.js + TypeScript + Supabase + capa World Office). Úsala al crear una sección de panel, un endpoint, un flujo de cotización/pedido o cualquier feature, para garantizar código legible, genérico/reutilizable, tipado desde el dominio y sin duplicación. Trigger: "agregar funcionalidad", "nueva sección", "nuevo panel", "nuevo endpoint", "crear feature".
---

# Crear una funcionalidad en la plataforma de cotizaciones y pedidos

Sigue estos pasos en orden. El objetivo es que toda funcionalidad nueva encaje
con la arquitectura existente: tipada desde el dominio, con lógica reutilizada y
sin código duplicado.

## 1. Ubica antes de crear

Antes de escribir nada, revisa si ya existe lo que necesitas:

- ¿La entidad ya está en `src/domain/tipos.ts`? Reúsala, no la redefinas.
- ¿El cálculo (totales, descuento, IVA) ya está en `src/domain/calculos.ts`?
- ¿El componente visual ya está en `src/components/`?
- ¿La utilidad (formato moneda/fecha, roles) ya está en `src/lib/`?

Si algo se usará más de una vez, créalo como módulo compartido desde el inicio.

## 2. Decide la capa correcta

| Necesitas… | Va en… |
|---|---|
| Tipo o regla de negocio | `src/domain/` |
| UI reutilizable (tabla, botón, badge, buscador) | `src/components/` |
| Pantalla/panel | `src/app/<rol>/...` |
| Acceso a datos (lectura/escritura) | Server Component o Server Action con `crearClienteServidor()` |
| Hablar con World Office | `obtenerClienteWorldOffice()` de `src/worldoffice` |
| Formato, roles, helpers | `src/lib/` |

## 3. Reglas no negociables

- **Código genérico, nunca atado al cliente.** No hardcodees el nombre de la
  empresa, sus correos ni datos suyos. Lo específico del cliente se lee desde
  `.env.local` / `src/config/app.ts` con defaults genéricos. Si necesitas mostrar
  el nombre de la empresa o la app, usa `NOMBRE_EMPRESA` / `NOMBRE_APP` de
  `src/config/app.ts`. La meta: que el mismo código sirva en otro cliente
  cambiando solo la configuración.
- **Tipos solo desde `domain/tipos.ts`.** Nada de `any` ni entidades duplicadas.
- **Cálculos solo desde `domain/calculos.ts`.** El frontend previsualiza y el
  backend persiste con la MISMA función.
- **Datos sensibles solo en `.env.local`** (token World Office, claves Supabase,
  credenciales Gmail). Léelos vía `process.env`, nunca los escribas en código.
- **El `codigo` contable se conserva siempre** en productos y líneas de orden,
  aunque la búsqueda/selección sea por descripción.
- **World Office siempre por el contrato.** Nunca instancies `ClienteWorldOfficeLive`
  o `...Mock` directo; usa `obtenerClienteWorldOffice()`.
- **Acceso por rol vía RLS** (`supabase/migrations/0002_rls.sql`) y guard de ruta.
  Si agregas tabla nueva, agrega su política RLS.

## 4. Checklist de cierre

- [ ] `npm run typecheck` sin errores.
- [ ] No hay lógica/UI duplicada que ya existiera en `domain`/`lib`/`components`.
- [ ] Sin claves ni datos sensibles en el código.
- [ ] Si tocaste el modelo de datos, actualizaste la migración y (si aplica) RLS.
- [ ] Nombres claros en español; funciones cortas, una responsabilidad.
