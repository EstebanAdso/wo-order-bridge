"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresca los datos del servidor cada cierto intervalo para simular "tiempo
 * real" en modo demo. En producción con Supabase se sustituye por una
 * suscripción Realtime (push), pero la API del panel no cambia.
 */
export function AutoActualizar({ segundos = 8 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), segundos * 1000);
    return () => clearInterval(id);
  }, [router, segundos]);
  return null;
}
