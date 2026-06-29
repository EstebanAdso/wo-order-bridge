/**
 * Descarga en lote las estructuras World Office de los pedidos pendientes.
 *
 * Devuelve un JSON con todos los pedidos en estado "pedido" listos para entrar a
 * World Office. Útil como entregable y para una eventual carga por lotes.
 * Solo lo usan contable y administrador.
 */

import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth/sesion";
import { obtenerRepositorio } from "@/lib/datos";
import { construirPayloadWorldOffice } from "@/worldoffice";

export async function GET() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol === "vendedor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const empresaId = process.env.WORLDOFFICE_EMPRESA_ID ?? "EMPRESA-DEMO";
  const pedidos = await obtenerRepositorio().listarOrdenes({ estado: "pedido" });
  const estructuras = pedidos.map((o) =>
    construirPayloadWorldOffice(o, empresaId, "PEDIDO"),
  );

  const documento = {
    generadoEn: new Date().toISOString(),
    totalPedidos: estructuras.length,
    pedidos: estructuras,
  };

  return new NextResponse(JSON.stringify(documento, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="worldoffice-estructuras.json"`,
    },
  });
}
