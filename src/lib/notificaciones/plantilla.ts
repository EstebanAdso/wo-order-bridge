/**
 * Plantilla del correo de "pedido nuevo".
 *
 * Genera el asunto y el cuerpo (texto + HTML) a partir de una orden. Se reutiliza
 * tanto en el modo demo (consola) como en producción (Gmail), evitando duplicar
 * el contenido del mensaje.
 */

import { NOMBRE_APP } from "@/config/app";
import type { Orden } from "@/domain/tipos";
import { formatearPesos } from "@/lib/formato";
import type { CorreoSalida } from "./notificador";

/** Destinatario del área contable (configurable por entorno). */
function destinatarioContable(): string {
  return process.env.NOTIFICACIONES_CONTABLE_TO ?? "contabilidad@tu-empresa.com";
}

/** Construye el correo de aviso de pedido nuevo para el área contable. */
export function correoPedidoNuevo(orden: Orden): CorreoSalida {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const enlace = `${base}/contable`;

  const lineasTexto = orden.lineas
    .map((l) => `  - ${l.cantidad} x ${l.descripcion} (${l.codigo})`)
    .join("\n");

  const lineasHtml = orden.lineas
    .map(
      (l) =>
        `<tr><td>${l.cantidad}</td><td>${l.descripcion}</td><td>${l.codigo}</td><td align="right">${formatearPesos(l.totalLinea)}</td></tr>`,
    )
    .join("");

  return {
    para: destinatarioContable(),
    asunto: `Nuevo pedido ${orden.consecutivo} — ${orden.clienteNombre}`,
    cuerpoTexto: [
      `Entró un pedido nuevo en ${NOMBRE_APP}.`,
      ``,
      `Consecutivo: ${orden.consecutivo}`,
      `Cliente: ${orden.clienteNombre}`,
      `Vendedor: ${orden.vendedorNombre}`,
      `Total: ${formatearPesos(orden.total)}`,
      ``,
      `Productos:`,
      lineasTexto,
      ``,
      `Revísalo y conviértelo en factura: ${enlace}`,
    ].join("\n"),
    cuerpoHtml: `
      <h2>Nuevo pedido ${orden.consecutivo}</h2>
      <p><strong>Cliente:</strong> ${orden.clienteNombre}<br/>
         <strong>Vendedor:</strong> ${orden.vendedorNombre}<br/>
         <strong>Total:</strong> ${formatearPesos(orden.total)}</p>
      <table border="1" cellpadding="6" cellspacing="0">
        <thead><tr><th>Cant.</th><th>Descripción</th><th>Código</th><th>Total</th></tr></thead>
        <tbody>${lineasHtml}</tbody>
      </table>
      <p><a href="${enlace}">Abrir panel contable</a></p>
    `,
  };
}
