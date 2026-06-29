/**
 * Contrato del servicio de notificaciones por correo.
 *
 * Igual que la capa World Office: la app depende de esta interfaz, no de una
 * implementación concreta. Hay dos:
 *   - notificador-consola.ts → imprime el correo en consola (modo demo).
 *   - notificador-gmail.ts    → envía vía Gmail API (producción).
 *
 * La fábrica de `index.ts` elige según el entorno.
 */

import type { Orden } from "@/domain/tipos";

/** Un correo listo para enviarse. */
export interface CorreoSalida {
  para: string;
  asunto: string;
  cuerpoTexto: string;
  cuerpoHtml: string;
}

export interface Notificador {
  /** Avisa al área contable que entró un pedido nuevo. */
  notificarPedidoNuevo(orden: Orden): Promise<void>;
}
