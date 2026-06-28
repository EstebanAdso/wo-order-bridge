"use server";

import { revalidatePath } from "next/cache";
import type { Producto } from "@/domain/tipos";
import { requerirRol } from "@/lib/auth/sesion";
import { obtenerRepositorio } from "@/lib/datos";

/** Busca productos por descripción o código (lo llama el buscador en vivo). */
export async function buscarProductosAccion(termino: string): Promise<Producto[]> {
  await requerirRol("vendedor");
  return obtenerRepositorio().buscarProductos(termino);
}

export interface DatosNuevaOrden {
  clienteId: string;
  estado: "cotizacion" | "pedido";
  lineas: Array<{ productoId: string; cantidad: number; descuentoPct?: number }>;
}

export interface ResultadoCrearOrden {
  ok: boolean;
  mensaje: string;
  consecutivo?: string;
}

/**
 * Crea la orden (cotización o pedido) a nombre del vendedor en sesión.
 * El vendedorId se toma de la sesión, nunca del cliente, por seguridad.
 */
export async function crearOrdenAccion(
  datos: DatosNuevaOrden,
): Promise<ResultadoCrearOrden> {
  const vendedor = await requerirRol("vendedor");

  if (!datos.clienteId) return { ok: false, mensaje: "Selecciona un cliente." };
  if (datos.lineas.length === 0)
    return { ok: false, mensaje: "Agrega al menos un producto." };

  const orden = await obtenerRepositorio().crearOrden({
    vendedorId: vendedor.id,
    clienteId: datos.clienteId,
    estado: datos.estado,
    lineas: datos.lineas,
  });

  revalidatePath("/vendedor");
  return {
    ok: true,
    consecutivo: orden.consecutivo,
    mensaje:
      datos.estado === "pedido"
        ? `Pedido ${orden.consecutivo} generado y enviado al área contable.`
        : `Cotización ${orden.consecutivo} guardada.`,
  };
}
