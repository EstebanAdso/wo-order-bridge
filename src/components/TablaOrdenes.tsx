import type { ReactNode } from "react";
import type { Orden } from "@/domain/tipos";
import { BadgeEstado } from "./BadgeEstado";
import { formatearFecha, formatearPesos } from "@/lib/formato";

interface Props {
  ordenes: Orden[];
  /** Muestra la columna de vendedor (paneles contable y admin). */
  mostrarVendedor?: boolean;
  /** Acción opcional por fila (ej. botón "Convertir a factura"). */
  accion?: (orden: Orden) => ReactNode;
  /** Texto cuando no hay órdenes. */
  vacio?: string;
}

/** Tabla de órdenes reutilizable por los tres paneles. */
export function TablaOrdenes({
  ordenes,
  mostrarVendedor = false,
  accion,
  vacio = "No hay órdenes todavía.",
}: Props) {
  if (ordenes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-400">
        {vacio}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2">Consecutivo</th>
            <th className="px-4 py-2">Cliente</th>
            {mostrarVendedor && <th className="px-4 py-2">Vendedor</th>}
            <th className="px-4 py-2">Estado</th>
            <th className="px-4 py-2 text-right">Total</th>
            <th className="px-4 py-2">Fecha</th>
            {accion && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ordenes.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50">
              <td className="px-4 py-2 font-mono text-xs">{o.consecutivo}</td>
              <td className="px-4 py-2">{o.clienteNombre}</td>
              {mostrarVendedor && <td className="px-4 py-2">{o.vendedorNombre}</td>}
              <td className="px-4 py-2">
                <BadgeEstado estado={o.estado} />
              </td>
              <td className="px-4 py-2 text-right font-medium">
                {formatearPesos(o.total)}
              </td>
              <td className="px-4 py-2 text-xs text-slate-500">
                {formatearFecha(o.creadaEn)}
              </td>
              {accion && <td className="px-4 py-2 text-right">{accion(o)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
