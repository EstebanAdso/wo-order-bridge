# Plataforma de Cotizaciones y Pedidos — Reglas del proyecto

Plataforma web interna de cotizaciones y pedidos para vendedores, conectada con
World Office Cloud. Stack: **Next.js (App Router) + TypeScript + Supabase**.

## Principios

1. **Código legible antes que ingenioso.** Nombres claros en español (dominio del
   negocio), funciones cortas, una responsabilidad por archivo.
2. **No duplicar.** Si una lógica o un componente se usa más de una vez, va a un
   módulo compartido y se reutiliza. Antes de escribir algo nuevo, revisa si ya
   existe en `src/domain`, `src/lib` o `src/components`.
3. **Datos sensibles solo en `.env.local`.** Nunca hardcodear claves, tokens ni
   correos. La plantilla es `.env.example`.
4. **El código contable manda.** El producto se busca por descripción o código,
   pero el `codigo` contable siempre se conserva y es el que viaja a World Office.
5. **Código genérico y reutilizable.** Nunca hardcodees el nombre del cliente ni
   datos suyos en el código. Lo específico de la empresa (nombre, correos, marca)
   se lee desde `.env.local` / `src/config/app.ts` con valores por defecto
   genéricos. La plataforma debe servir en otro cliente cambiando solo la
   configuración, sin modificar el código.

## Estructura

```
src/
  app/            Rutas y paneles (Next.js App Router). Un panel por rol.
  components/     Componentes de UI reutilizables (sin lógica de negocio pesada).
  domain/         Tipos y cálculos del negocio. FUENTE ÚNICA de verdad.
    tipos.ts        Entidades: Usuario, Producto, Cliente, Orden, LineaOrden...
    calculos.ts     Totales, descuentos, IVA. Módulo puro y reutilizable.
  data/           Catálogo de muestra (generado con IA).
  lib/            Utilidades transversales: supabase, formato, roles.
  worldoffice/    Integración con World Office (contrato + mock + live + payload).
supabase/         Migraciones SQL y seed.
scripts/          Utilidades de build (ej. generar seed del catálogo).
docs/             Documento del concurso, plan de integración y manual.
```

## Convenciones

- **Idioma:** dominio y UI en español; términos técnicos estándar en inglés
  cuando es lo habitual (`fetch`, `Promise`, etc.).
- **Tipos:** todo lo del negocio se tipa desde `src/domain/tipos.ts`. No
  redefinir entidades en otros archivos.
- **Cálculos:** subtotales, descuentos e IVA SOLO desde `src/domain/calculos.ts`.
  El panel y el backend usan la misma fórmula para que coincidan siempre.
- **World Office:** la app nunca instancia un cliente concreto. Siempre
  `obtenerClienteWorldOffice()` desde `src/worldoffice`. Mock en concurso, live
  con `WORLDOFFICE_MODE=live`.
- **Supabase:** navegador → `crearClienteNavegador()`; servidor →
  `crearClienteServidor()`. El acceso por rol lo aplica RLS (ver `supabase/`).

## Commits

- **Autoría del dueño del repo.** Los commits van a nombre del propietario del
  repositorio. NO incluir trailers de co-autoría ni mención de herramientas de
  IA (nada de `Co-Authored-By: Claude` ni similares).
- **Convención obligatoria:** `<emoji> <tipo>: descripción` en imperativo y
  minúscula. Tipos y emojis en la tabla del README (`feat 🚀`, `fix 🐛`,
  `refactor ♻️`, `docs 📝`, `chore 🔧`, `style 🎨`, `test ✅`, `perf ⚡`,
  `security 🔒`).

## Antes de dar por terminado un cambio

- `npm run typecheck` sin errores.
- Sin claves ni datos sensibles en el código.
- Sin lógica duplicada que ya exista en `domain`/`lib`/`components`.
