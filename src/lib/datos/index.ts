/**
 * Punto de entrada del repositorio de datos.
 *
 * Devuelve la implementación correcta según el entorno:
 *   - "demo" (por defecto): datos en memoria, corre sin configurar nada.
 *   - "supabase": Postgres/Supabase (producción).
 *
 * El resto de la app siempre importa `obtenerRepositorio()` y nunca instancia
 * una implementación concreta, igual que la capa de World Office.
 */

import { RepositorioMemoria } from "./repositorio-memoria";
import { RepositorioSupabase } from "./repositorio-supabase";
import type { Repositorio } from "./repositorio";

let instancia: Repositorio | null = null;

export function obtenerRepositorio(): Repositorio {
  if (instancia) return instancia;

  const modo = process.env.DATA_MODE ?? "demo";

  switch (modo) {
    case "supabase":
      instancia = new RepositorioSupabase();
      break;
    default:
      instancia = new RepositorioMemoria();
  }

  return instancia;
}

/** True si la plataforma corre contra Supabase (persistencia + Auth reales). */
export function esModoSupabase(): boolean {
  return (process.env.DATA_MODE ?? "demo") === "supabase";
}

export type { Repositorio } from "./repositorio";
