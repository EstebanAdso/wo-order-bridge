/**
 * Genera el seed SQL del catálogo a partir de `src/data/catalogo.ts`.
 *
 * El catálogo se define UNA sola vez (en TypeScript, tipado). Este script lo
 * traduce a SQL para sembrar Supabase, evitando mantener los datos en dos
 * lugares. Ejecutar con: `npm run seed:catalogo`.
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOGO, idDesdeCodigo } from "../src/data/catalogo.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const salida = resolve(__dirname, "../supabase/seed-catalogo.sql");

/** Escapa comillas simples para insertarlas con seguridad en SQL. */
function sql(valor: string): string {
  return valor.replace(/'/g, "''");
}

const filas = CATALOGO.map((p) => {
  const id = idDesdeCodigo(p.codigo);
  return `  ('${id}', '${sql(p.codigo)}', '${sql(p.descripcion)}', '${p.categoria}', '${sql(p.marca)}', '${sql(p.unidad)}', ${p.precio}, ${p.ivaPct}, ${p.stock}, true)`;
}).join(",\n");

const contenido = `-- ============================================================================
--  Seed del catálogo (GENERADO automáticamente desde src/data/catalogo.ts).
--  No editar a mano: ejecutar \`npm run seed:catalogo\` para regenerar.
-- ============================================================================

insert into productos (id, codigo, descripcion, categoria, marca, unidad, precio, iva_pct, stock, activo)
values
${filas}
on conflict (id) do update set
  descripcion = excluded.descripcion,
  precio      = excluded.precio,
  stock       = excluded.stock,
  activo      = excluded.activo;
`;

writeFileSync(salida, contenido, "utf8");
console.log(`Seed generado: ${salida} (${CATALOGO.length} productos)`);
