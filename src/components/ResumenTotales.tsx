import type { TotalesOrden } from "@/domain/calculos";
import { formatearPesos } from "@/lib/formato";

/** Resumen de totales (subtotal, descuento, IVA, total). Reutilizable. */
export function ResumenTotales({ totales }: { totales: TotalesOrden }) {
  return (
    <dl className="space-y-1 text-sm">
      <Fila etiqueta="Subtotal" valor={totales.subtotal} />
      <Fila etiqueta="Descuento" valor={-totales.descuentoTotal} />
      <Fila etiqueta="IVA" valor={totales.iva} />
      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
        <dt>Total</dt>
        <dd>{formatearPesos(totales.total)}</dd>
      </div>
    </dl>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <dt>{etiqueta}</dt>
      <dd>{formatearPesos(valor)}</dd>
    </div>
  );
}
