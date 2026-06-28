/**
 * Manejo de sesión (modo demo).
 *
 * Guarda el id del usuario en una cookie httpOnly. En producción este módulo se
 * reemplaza por la sesión de Supabase Auth, manteniendo la misma API pública
 * (`obtenerUsuarioActual`, `requerirRol`, etc.) para no tocar los paneles.
 */

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Rol, Usuario } from "@/domain/tipos";
import { obtenerRepositorio } from "@/lib/datos";
import { RUTA_PANEL } from "@/lib/roles";

const COOKIE_SESION = "sesion";

/** Inicia sesión guardando el id del usuario en una cookie segura. */
export async function iniciarSesion(usuarioId: string): Promise<void> {
  const almacen = await cookies();
  almacen.set(COOKIE_SESION, usuarioId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
}

/** Cierra la sesión actual. */
export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(COOKIE_SESION);
}

/** Devuelve el usuario autenticado, o null si no hay sesión válida. */
export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  const almacen = await cookies();
  const id = almacen.get(COOKIE_SESION)?.value;
  if (!id) return null;
  return obtenerRepositorio().obtenerUsuario(id);
}

/**
 * Exige sesión con uno de los roles dados. Si no cumple, redirige.
 * Devuelve el usuario para usarlo en el panel.
 */
export async function requerirRol(...roles: Rol[]): Promise<Usuario> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  if (!roles.includes(usuario.rol)) redirect(RUTA_PANEL[usuario.rol]);
  return usuario;
}
