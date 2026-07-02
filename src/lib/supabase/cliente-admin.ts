/**
 * Cliente Supabase con SERVICE ROLE (acceso total, salta RLS).
 *
 * Úsalo SOLO en el servidor y SOLO para operaciones administrativas que la
 * sesión del usuario no puede hacer por RLS: crear/eliminar usuarios de
 * Supabase Auth y sembrar datos. Nunca lo importes en código de navegador.
 *
 * La clave se lee de `SUPABASE_SERVICE_ROLE_KEY` (variable de entorno secreta).
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function crearClienteAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para el cliente admin.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
