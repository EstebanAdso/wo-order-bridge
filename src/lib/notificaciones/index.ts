/**
 * Punto de entrada de las notificaciones.
 *
 * Usa Gmail si están configuradas todas sus credenciales; de lo contrario, cae
 * al notificador de consola (modo demo). El resto de la app solo llama
 * `obtenerNotificador()`.
 */

import { NotificadorConsola } from "./notificador-consola";
import { NotificadorGmail } from "./notificador-gmail";
import type { Notificador } from "./notificador";

let instancia: Notificador | null = null;

export function obtenerNotificador(): Notificador {
  if (instancia) return instancia;

  const { GMAIL_SENDER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } =
    process.env;

  const gmailConfigurado =
    GMAIL_SENDER && GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN;

  instancia = gmailConfigurado
    ? new NotificadorGmail({
        sender: GMAIL_SENDER,
        clientId: GMAIL_CLIENT_ID,
        clientSecret: GMAIL_CLIENT_SECRET,
        refreshToken: GMAIL_REFRESH_TOKEN,
      })
    : new NotificadorConsola();

  return instancia;
}

export type { Notificador } from "./notificador";
