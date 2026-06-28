"use server";

import { redirect } from "next/navigation";
import { cerrarSesion } from "@/lib/auth/sesion";

/** Server Action: cierra la sesión y vuelve al login. */
export async function accionCerrarSesion(): Promise<void> {
  await cerrarSesion();
  redirect("/login");
}
