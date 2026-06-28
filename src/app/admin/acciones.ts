"use server";

import { revalidatePath } from "next/cache";
import type { Rol } from "@/domain/tipos";
import { requerirRol } from "@/lib/auth/sesion";
import { obtenerRepositorio } from "@/lib/datos";
import { esRol } from "@/lib/roles";

export interface EstadoFormUsuario {
  error?: string;
  ok?: string;
}

/** Crea un vendedor o contable (solo el administrador). */
export async function crearUsuarioAccion(
  _previo: EstadoFormUsuario,
  formData: FormData,
): Promise<EstadoFormUsuario> {
  await requerirRol("administrador");

  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rol = String(formData.get("rol") ?? "");
  const clave = String(formData.get("clave") ?? "");

  if (!nombre || !email || !clave) {
    return { error: "Completa nombre, correo y contraseña." };
  }
  if (!esRol(rol) || rol === "administrador") {
    return { error: "El rol debe ser vendedor o contable." };
  }

  try {
    await obtenerRepositorio().crearUsuario({ nombre, email, rol: rol as Rol, clave });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo crear el usuario." };
  }

  revalidatePath("/admin");
  return { ok: `Usuario ${nombre} creado.` };
}

/** Elimina un usuario por id. */
export async function eliminarUsuarioAccion(id: string): Promise<void> {
  await requerirRol("administrador");
  await obtenerRepositorio().eliminarUsuario(id);
  revalidatePath("/admin");
}

/** Actualiza el stock de un producto (gestión de inventario). */
export async function actualizarStockAccion(
  productoId: string,
  stock: number,
): Promise<void> {
  await requerirRol("administrador");
  await obtenerRepositorio().actualizarStock(productoId, Math.max(0, stock));
  revalidatePath("/admin");
}
