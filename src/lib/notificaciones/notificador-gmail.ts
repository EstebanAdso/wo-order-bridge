/**
 * Notificador por Gmail (producción).
 *
 * Envía el correo usando la cuenta de Gmail de la empresa vía OAuth2. Las
 * credenciales viven en variables de entorno (nunca en el código). El detalle
 * de cómo obtener el refresh token está en el manual y el plan de integración.
 */

import nodemailer from "nodemailer";
import type { Orden } from "@/domain/tipos";
import type { Notificador } from "./notificador";
import { correoPedidoNuevo } from "./plantilla";

export interface ConfigGmail {
  sender: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export class NotificadorGmail implements Notificador {
  constructor(private readonly config: ConfigGmail) {}

  private transporte() {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: this.config.sender,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        refreshToken: this.config.refreshToken,
      },
    });
  }

  async notificarPedidoNuevo(orden: Orden): Promise<void> {
    const correo = correoPedidoNuevo(orden);
    await this.transporte().sendMail({
      from: this.config.sender,
      to: correo.para,
      subject: correo.asunto,
      text: correo.cuerpoTexto,
      html: correo.cuerpoHtml,
    });
  }
}
