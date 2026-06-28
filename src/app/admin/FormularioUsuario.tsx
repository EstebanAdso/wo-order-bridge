"use client";

import { useActionState } from "react";
import { crearUsuarioAccion, type EstadoFormUsuario } from "./acciones";

const INICIAL: EstadoFormUsuario = {};

/** Formulario para crear vendedores y contables. */
export function FormularioUsuario() {
  const [estado, accion, enviando] = useActionState(crearUsuarioAccion, INICIAL);

  return (
    <form action={accion} className="grid gap-3 sm:grid-cols-2">
      <input
        name="nombre"
        placeholder="Nombre completo"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500"
      />
      <input
        name="email"
        type="email"
        placeholder="correo@empresa.com"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500"
      />
      <select
        name="rol"
        required
        defaultValue="vendedor"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500"
      >
        <option value="vendedor">Vendedor</option>
        <option value="contable">Contable</option>
      </select>
      <input
        name="clave"
        type="text"
        placeholder="Contraseña inicial"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500"
      />

      {estado.error && (
        <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.error}
        </p>
      )}
      {estado.ok && (
        <p className="sm:col-span-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {estado.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="sm:col-span-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:opacity-50"
      >
        {enviando ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
