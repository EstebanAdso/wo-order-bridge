"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { convertirEnFacturaAccion } from "./acciones";

/** Botón que convierte un pedido en factura (World Office) desde la tabla. */
export function BotonFacturar({ ordenId }: { ordenId: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function facturar() {
    setError(null);
    iniciar(async () => {
      const r = await convertirEnFacturaAccion(ordenId);
      if (!r.ok) setError(r.mensaje);
      else router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={facturar}
        disabled={pendiente}
        className="rounded-md bg-green-700 px-3 py-1 text-xs font-medium text-white transition hover:bg-green-800 disabled:opacity-50"
      >
        {pendiente ? "Facturando…" : "Convertir a factura"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
