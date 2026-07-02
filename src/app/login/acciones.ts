"use server";

import { redirect } from "next/navigation";
import { autenticar } from "@/lib/auth/sesion";
import { RUTA_PANEL } from "@/lib/roles";

/** Resultado del intento de inicio de sesión (para mostrar error en el form). */
export interface EstadoLogin {
  error?: string;
}

/**
 * Server Action: valida credenciales, abre sesión y redirige al panel del rol.
 * Compatible con `useActionState` del formulario de login.
 */
export async function accionIniciarSesion(
  _estadoPrevio: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const clave = String(formData.get("clave") ?? "");

  if (!email || !clave) {
    return { error: "Ingresa correo y contraseña." };
  }

  const usuario = await autenticar(email, clave);
  if (!usuario) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect(RUTA_PANEL[usuario.rol]);
}
