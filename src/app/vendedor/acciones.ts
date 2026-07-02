"use server";

import { revalidatePath } from "next/cache";
import type { Producto } from "@/domain/tipos";
import { requerirRol } from "@/lib/auth/sesion";
import { obtenerRepositorio } from "@/lib/datos";
import { obtenerNotificador } from "@/lib/notificaciones";
import { obtenerClienteWorldOffice } from "@/worldoffice";

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

  const repo = obtenerRepositorio();
  const orden = await repo.crearOrden({
    vendedorId: vendedor.id,
    clienteId: datos.clienteId,
    estado: datos.estado,
    lineas: datos.lineas,
  });

  // Una cotización solo se guarda; no toca World Office.
  if (orden.estado !== "pedido") {
    revalidatePath("/vendedor");
    return {
      ok: true,
      consecutivo: orden.consecutivo,
      mensaje: `Cotización ${orden.consecutivo} guardada.`,
    };
  }

  // Al generar un PEDIDO se crea en tiempo real en World Office (paso 4 del
  // flujo del concurso). El id del documento se guarda en la orden para
  // trazabilidad y para que la factura edite ESE documento (sin duplicar).
  const worldOffice = obtenerClienteWorldOffice();
  const resultadoWO = await worldOffice.crearPedido(orden);
  if (resultadoWO.ok && resultadoWO.documentoId) {
    orden.worldOfficeDocId = resultadoWO.documentoId;
    await repo.cambiarEstadoOrden(orden.id, "pedido", resultadoWO.documentoId);
  }

  // Avisa al área contable por correo. No bloquea la respuesta al vendedor si
  // el correo falla: se registra y se continúa.
  try {
    await obtenerNotificador().notificarPedidoNuevo(orden);
  } catch (e) {
    console.error("No se pudo notificar al área contable:", e);
  }

  revalidatePath("/vendedor");

  // Si World Office falló, el pedido queda guardado igual (reintentable por
  // idempotencia); se avisa al vendedor sin perder la orden.
  if (!resultadoWO.ok) {
    return {
      ok: true,
      consecutivo: orden.consecutivo,
      mensaje: `Pedido ${orden.consecutivo} guardado y notificado. Aviso: no se pudo crear en World Office (${resultadoWO.mensaje}). Se reintentará.`,
    };
  }

  return {
    ok: true,
    consecutivo: orden.consecutivo,
    mensaje: `Pedido ${orden.consecutivo} generado en World Office y enviado al área contable.`,
  };
}
