import type { EstadoOrden } from "@/domain/tipos";

const ESTILOS: Record<EstadoOrden, { texto: string; clase: string }> = {
  cotizacion: { texto: "Cotización", clase: "bg-amber-100 text-amber-800" },
  pedido: { texto: "Pedido", clase: "bg-blue-100 text-blue-800" },
  facturado: { texto: "Facturado", clase: "bg-green-100 text-green-800" },
};

/** Etiqueta de color según el estado de la orden. Reutilizable en los 3 paneles. */
export function BadgeEstado({ estado }: { estado: EstadoOrden }) {
  const { texto, clase } = ESTILOS[estado];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${clase}`}>
      {texto}
    </span>
  );
}
