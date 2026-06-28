/**
 * Implementación LIVE del cliente World Office (el 10% final del ganador).
 *
 * Toda la app ya consume el contrato `ClienteWorldOffice`. Para activar la
 * conexión real solo hay que: (1) completar los TODO de este archivo con las
 * rutas y el mapeo de campos confirmados contra la cuenta real, y (2) poner
 * WORLDOFFICE_MODE="live" en el entorno. Nada más de la plataforma cambia.
 *
 * El plan detallado (endpoints, autenticación, manejo de errores, idempotencia)
 * está en docs/INTEGRACION-WORLD-OFFICE.md.
 */

import type { Orden } from "@/domain/tipos";
import type {
  ClienteWorldOffice,
  InventarioVivo,
  ResultadoWorldOffice,
} from "./contrato";
import { construirPayloadWorldOffice } from "./payload";

export interface ConfigWorldOfficeLive {
  baseUrl: string;
  token: string;
  empresaId: string;
}

export class ClienteWorldOfficeLive implements ClienteWorldOffice {
  constructor(private readonly config: ConfigWorldOfficeLive) {}

  /** Cabeceras comunes: autenticación por token (Bearer) y JSON. */
  private headers(): HeadersInit {
    return {
      Authorization: `Bearer ${this.config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async crearPedido(orden: Orden): Promise<ResultadoWorldOffice> {
    const payload = construirPayloadWorldOffice(
      orden,
      this.config.empresaId,
      "PEDIDO",
    );

    // TODO (fase live): confirmar ruta exacta del endpoint de documentos.
    const res = await fetch(`${this.config.baseUrl}/v1/documentos`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        ok: false,
        documentoId: null,
        mensaje: `World Office respondió ${res.status}: ${await res.text()}`,
        payloadEnviado: payload,
      };
    }

    const data = (await res.json()) as { id?: string };
    return {
      ok: true,
      documentoId: data.id ?? null,
      mensaje: "Pedido creado en World Office.",
      payloadEnviado: payload,
    };
  }

  async convertirEnFactura(orden: Orden): Promise<ResultadoWorldOffice> {
    const payload = construirPayloadWorldOffice(
      orden,
      this.config.empresaId,
      "FACTURA_VENTA",
    );

    // TODO (fase live): confirmar si la factura se crea como documento nuevo
    // o por "conversión" del pedido referenciando orden.worldOfficeDocId.
    const res = await fetch(`${this.config.baseUrl}/v1/documentos`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        ok: false,
        documentoId: null,
        mensaje: `World Office respondió ${res.status}: ${await res.text()}`,
        payloadEnviado: payload,
      };
    }

    const data = (await res.json()) as { id?: string };
    return {
      ok: true,
      documentoId: data.id ?? null,
      mensaje: "Factura creada en World Office.",
      payloadEnviado: payload,
    };
  }

  async consultarInventario(codigos: string[]): Promise<InventarioVivo[]> {
    // TODO (fase live): confirmar endpoint de inventario y si admite consulta
    // por lote de códigos o requiere una llamada por código.
    const res = await fetch(
      `${this.config.baseUrl}/v1/inventario?codigos=${codigos.join(",")}`,
      { headers: this.headers() },
    );

    if (!res.ok) {
      throw new Error(`World Office inventario respondió ${res.status}`);
    }

    return (await res.json()) as InventarioVivo[];
  }
}
