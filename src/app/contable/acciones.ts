"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/auth/sesion";
import { obtenerRepositorio } from "@/lib/datos";
import { obtenerClienteWorldOffice } from "@/worldoffice";

export interface ResultadoFactura {
  ok: boolean;
  mensaje: string;
}

/**
 * Convierte un pedido en factura dentro de World Office.
 * Durante el concurso usa el cliente mock; en producción, el live.
 */
export async function convertirEnFacturaAccion(
  ordenId: string,
): Promise<ResultadoFactura> {
  await requerirRol("contable");
  const repo = obtenerRepositorio();

  const orden = await repo.obtenerOrden(ordenId);
  if (!orden) return { ok: false, mensaje: "Orden no encontrada." };
  if (orden.estado !== "pedido")
    return { ok: false, mensaje: "Solo se facturan pedidos." };

  const worldOffice = obtenerClienteWorldOffice();
  const resultado = await worldOffice.convertirEnFactura(orden);
  if (!resultado.ok) {
    return { ok: false, mensaje: resultado.mensaje };
  }

  await repo.cambiarEstadoOrden(
    ordenId,
    "facturado",
    resultado.documentoId ?? undefined,
  );
  revalidatePath("/contable");
  return {
    ok: true,
    mensaje: `Factura creada en World Office (${resultado.documentoId}).`,
  };
}
