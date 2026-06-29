/**
 * Descarga la ESTRUCTURA de World Office de una orden, en JSON.
 *
 * Es uno de los entregables del concurso: el archivo que alimentaría a World
 * Office para crear el pedido. Reutiliza el mismo builder que usará la conexión
 * en vivo (`construirPayloadWorldOffice`), así el archivo descargado es idéntico
 * al que se enviará por API.
 */

import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth/sesion";
import { obtenerRepositorio } from "@/lib/datos";
import { construirPayloadWorldOffice } from "@/worldoffice";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const orden = await obtenerRepositorio().obtenerOrden(id);
  if (!orden) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const empresaId = process.env.WORLDOFFICE_EMPRESA_ID ?? "EMPRESA-DEMO";
  const tipo = orden.estado === "facturado" ? "FACTURA_VENTA" : "PEDIDO";
  const payload = construirPayloadWorldOffice(orden, empresaId, tipo);

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="worldoffice-${orden.consecutivo}.json"`,
    },
  });
}
