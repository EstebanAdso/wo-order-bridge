"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Usuario } from "@/domain/tipos";

/** Filtro por vendedor: actualiza el query param y recarga la lista. */
export function FiltroVendedor({ vendedores }: { vendedores: Usuario[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const actual = params.get("vendedor") ?? "";

  function cambiar(vendedorId: string) {
    const nuevos = new URLSearchParams(params);
    if (vendedorId) nuevos.set("vendedor", vendedorId);
    else nuevos.delete("vendedor");
    router.push(`/contable?${nuevos.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      Vendedor:
      <select
        value={actual}
        onChange={(e) => cambiar(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-green-500"
      >
        <option value="">Todos</option>
        {vendedores.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
