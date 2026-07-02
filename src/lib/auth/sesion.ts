/**
 * Manejo de sesión, con dos modos transparentes para el resto de la app:
 *
 *   - demo      → id de usuario en cookie httpOnly + `RepositorioMemoria`.
 *   - supabase  → Supabase Auth (correo + contraseña) + perfil con rol.
 *
 * Los paneles solo usan `obtenerUsuarioActual` / `requerirRol`, que no cambian
 * entre modos. El login usa `autenticar`, que abre la sesión en el modo activo.
 */

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Rol, Usuario } from "@/domain/tipos";
import { esModoSupabase, obtenerRepositorio } from "@/lib/datos";
import { RUTA_PANEL } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

const COOKIE_SESION = "sesion";

/** Perfil de Supabase mapeado a Usuario del dominio. */
interface FilaPerfil {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  creado_en: string;
}

function perfilAUsuario(p: FilaPerfil): Usuario {
  return {
    id: p.id,
    email: p.email,
    nombre: p.nombre,
    rol: p.rol,
    activo: p.activo,
    creadoEn: p.creado_en,
  };
}

/**
 * Valida credenciales y ABRE la sesión en el modo activo.
 * Devuelve el usuario autenticado, o null si las credenciales no sirven.
 */
export async function autenticar(
  email: string,
  clave: string,
): Promise<Usuario | null> {
  if (esModoSupabase()) {
    const sb = await crearClienteServidor();
    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password: clave,
    });
    if (error || !data.user) return null;

    const { data: perfil } = await sb
      .from("perfiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!perfil || !(perfil as FilaPerfil).activo) {
      await sb.auth.signOut();
      return null;
    }
    return perfilAUsuario(perfil as FilaPerfil);
  }

  // Modo demo: valida contra el repositorio en memoria y guarda cookie.
  const usuario = await obtenerRepositorio().validarCredenciales(email, clave);
  if (!usuario) return null;
  await iniciarSesionDemo(usuario.id);
  return usuario;
}

/** (Demo) Guarda el id del usuario en una cookie segura. */
async function iniciarSesionDemo(usuarioId: string): Promise<void> {
  const almacen = await cookies();
  almacen.set(COOKIE_SESION, usuarioId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
}

/** Cierra la sesión actual en el modo activo. */
export async function cerrarSesion(): Promise<void> {
  if (esModoSupabase()) {
    const sb = await crearClienteServidor();
    await sb.auth.signOut();
    return;
  }
  const almacen = await cookies();
  almacen.delete(COOKIE_SESION);
}

/** Devuelve el usuario autenticado, o null si no hay sesión válida. */
export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  if (esModoSupabase()) {
    const sb = await crearClienteServidor();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return null;

    const { data: perfil } = await sb
      .from("perfiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil || !(perfil as FilaPerfil).activo) return null;
    return perfilAUsuario(perfil as FilaPerfil);
  }

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
