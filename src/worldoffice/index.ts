/**
 * Punto de entrada de la integración World Office.
 *
 * Devuelve la implementación correcta del cliente según WORLDOFFICE_MODE.
 * El resto de la app SIEMPRE importa desde aquí y nunca instancia un cliente
 * concreto, de modo que el cambio mock → live es transparente.
 */

import { ClienteWorldOfficeLive } from "./cliente-live";
import { ClienteWorldOfficeMock } from "./cliente-mock";
import type { ClienteWorldOffice } from "./contrato";

let instancia: ClienteWorldOffice | null = null;

/** Obtiene el cliente World Office (singleton por proceso). */
export function obtenerClienteWorldOffice(): ClienteWorldOffice {
  if (instancia) return instancia;

  const modo = process.env.WORLDOFFICE_MODE ?? "mock";
  const empresaId = process.env.WORLDOFFICE_EMPRESA_ID ?? "EMPRESA-DEMO";

  if (modo === "live") {
    instancia = new ClienteWorldOfficeLive({
      baseUrl: process.env.WORLDOFFICE_API_BASE_URL ?? "",
      token: process.env.WORLDOFFICE_API_TOKEN ?? "",
      empresaId,
    });
  } else {
    instancia = new ClienteWorldOfficeMock(empresaId);
  }

  return instancia;
}

export type { ClienteWorldOffice } from "./contrato";
export * from "./payload";
