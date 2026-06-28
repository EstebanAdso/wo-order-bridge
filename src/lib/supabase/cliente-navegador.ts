/**
 * Cliente Supabase para componentes de NAVEGADOR ("use client").
 * Usa la clave pública (anon). Nunca expongas aquí la service role key.
 */

import { createBrowserClient } from "@supabase/ssr";

export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
