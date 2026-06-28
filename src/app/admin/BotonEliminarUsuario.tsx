"use client";

import { useTransition } from "react";
import { eliminarUsuarioAccion } from "./acciones";

/** Botón para eliminar un usuario, con confirmación. */
export function BotonEliminarUsuario({
  id,
  nombre,
}: {
  id: string;
  nombre: string;
}) {
  const [pendiente, iniciar] = useTransition();

  function eliminar() {
    if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;
    iniciar(() => eliminarUsuarioAccion(id));
  }

  return (
    <button
      type="button"
      onClick={eliminar}
      disabled={pendiente}
      className="text-xs font-medium text-slate-400 transition hover:text-red-600 disabled:opacity-50"
    >
      {pendiente ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
