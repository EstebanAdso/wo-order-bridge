/**
 * Definiciones de roles y su ruta de panel.
 * Fuente única para guards de acceso y redirecciones tras iniciar sesión.
 */

import type { Route } from "next";
import type { Rol } from "@/domain/tipos";

/** Ruta del panel principal de cada rol. */
export const RUTA_PANEL: Record<Rol, Route> = {
  vendedor: "/vendedor",
  contable: "/contable",
  administrador: "/admin",
};

/** Etiqueta legible de cada rol, para la interfaz. */
export const ETIQUETA_ROL: Record<Rol, string> = {
  vendedor: "Vendedor",
  contable: "Contable",
  administrador: "Administrador",
};

/** Indica si un valor desconocido es un rol válido del sistema. */
export function esRol(valor: unknown): valor is Rol {
  return valor === "vendedor" || valor === "contable" || valor === "administrador";
}
