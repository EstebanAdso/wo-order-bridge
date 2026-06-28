"use client";

import { useActionState } from "react";
import { accionIniciarSesion, type EstadoLogin } from "./acciones";

const ESTADO_INICIAL: EstadoLogin = {};

/** Formulario de inicio de sesión con manejo de error y estado de envío. */
export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(
    accionIniciarSesion,
    ESTADO_INICIAL,
  );

  return (
    <form action={accion} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="clave" className="text-sm font-medium text-slate-700">
          Contraseña
        </label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
      </div>

      {estado.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-green-700 px-4 py-2 font-medium text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {enviando ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
