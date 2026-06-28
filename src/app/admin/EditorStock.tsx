"use client";

import { useState, useTransition } from "react";
import { actualizarStockAccion } from "./acciones";

/** Edición rápida del stock de un producto (inventario). */
export function EditorStock({
  productoId,
  stockActual,
}: {
  productoId: string;
  stockActual: number;
}) {
  const [valor, setValor] = useState(stockActual);
  const [pendiente, iniciar] = useTransition();
  const sinCambios = valor === stockActual;

  function guardar() {
    iniciar(() => actualizarStockAccion(productoId, valor));
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <input
        type="number"
        min={0}
        value={valor}
        onChange={(e) => setValor(Math.max(0, Number(e.target.value)))}
        className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm"
      />
      <button
        type="button"
        onClick={guardar}
        disabled={pendiente || sinCambios}
        className="rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-40"
      >
        {pendiente ? "…" : "Guardar"}
      </button>
    </div>
  );
}
