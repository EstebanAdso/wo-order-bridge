/**
 * Notificador de consola (modo demo).
 *
 * No envía correo real: imprime en consola del servidor el correo que se
 * enviaría. Permite probar el flujo completo sin configurar Gmail.
 */

import type { Orden } from "@/domain/tipos";
import type { Notificador } from "./notificador";
import { correoPedidoNuevo } from "./plantilla";

export class NotificadorConsola implements Notificador {
  async notificarPedidoNuevo(orden: Orden): Promise<void> {
    const correo = correoPedidoNuevo(orden);
    console.info(
      `\n[NOTIFICACIÓN demo] Correo a ${correo.para}\n` +
        `Asunto: ${correo.asunto}\n${correo.cuerpoTexto}\n`,
    );
  }
}
