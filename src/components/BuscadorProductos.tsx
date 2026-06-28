"use client";

import { useEffect, useRef, useState } from "react";
import type { Producto } from "@/domain/tipos";
import { buscarProductosAccion } from "@/app/vendedor/acciones";
import { formatearPesos } from "@/lib/formato";

interface Props {
  /** Se llama al elegir un producto del resultado. */
  onAgregar: (producto: Producto) => void;
}

/**
 * Buscador en vivo por descripción O por código (no excluyente).
 * Muestra stock y precio; al hacer clic agrega el producto a la cotización.
 */
export function BuscadorProductos({ onAgregar }: Props) {
  const [termino, setTermino] = useState("");
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Búsqueda con "debounce" para no consultar en cada tecla.
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      setCargando(true);
      setResultados(await buscarProductosAccion(termino));
      setCargando(false);
    }, 250);
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [termino]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={termino}
        onChange={(e) => setTermino(e.target.value)}
        placeholder="Buscar por descripción o código (ej. 'sello' o '0100178')"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
      />

      <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
        {cargando && resultados.length === 0 ? (
          <p className="p-3 text-sm text-slate-400">Buscando…</p>
        ) : resultados.length === 0 ? (
          <p className="p-3 text-sm text-slate-400">Sin resultados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {resultados.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {p.descripcion}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-mono">{p.codigo}</span> ·{" "}
                    {formatearPesos(p.precio)} · stock {p.stock}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAgregar(p)}
                  disabled={p.stock <= 0}
                  className="shrink-0 rounded-md bg-green-700 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-800 disabled:opacity-40"
                >
                  Agregar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
