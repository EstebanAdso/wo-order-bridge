/**
 * Implementación LIVE del cliente World Office Cloud (API real).
 *
 * Construida contra la documentación pública de World Office
 * (https://devapidoc.worldoffice.cloud). Toda la app ya consume el contrato
 * `ClienteWorldOffice`; para producción solo falta tener el token real de la
 * cuenta Enterprise y confirmar los IDs de configuración contable (empresa,
 * forma de pago, moneda, bodega, tipos de documento). Esos valores vienen de
 * variables de entorno, nunca del código.
 *
 * Detalles reales de la API:
 *   - Base:  https://api.worldoffice.cloud/api/v1
 *   - Auth:  header  Authorization: WO <token>   (NO es Bearer)
 *   - Venta: PUT /documentos/editarDocumentoVenta
 *   - Doc:   GET /documentos/getDocumentoId/{id}
 */

import type { Orden } from "@/domain/tipos";
import type {
  ClienteWorldOffice,
  InventarioVivo,
  ResultadoWorldOffice,
} from "./contrato";
import { aDocumentoVentaWO, type ConfigDocumentoWO } from "./mapeo-wo";
import { construirPayloadWorldOffice } from "./payload";

export interface ConfigWorldOfficeLive extends ConfigDocumentoWO {
  baseUrl: string;
  token: string;
  /** Tipo de documento para pedidos (los pedidos usan su propio código). */
  documentoTipoPedido: string;
}

export class ClienteWorldOfficeLive implements ClienteWorldOffice {
  constructor(private readonly config: ConfigWorldOfficeLive) {}

  /** Cabeceras: autenticación con prefijo "WO" (no Bearer) y JSON. */
  private headers(): HeadersInit {
    return {
      Authorization: `WO ${this.config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Resuelve el idInventario de World Office para cada código contable.
   * Consulta el inventario y arma el mapa código → idInventario.
   */
  private async resolverInventario(
    codigos: string[],
  ): Promise<Map<string, number>> {
    const inventario = await this.consultarInventarioCrudo(codigos);
    const mapa = new Map<string, number>();
    for (const item of inventario) {
      if (item.codigo && typeof item.idInventario === "number") {
        mapa.set(item.codigo, item.idInventario);
      }
    }
    return mapa;
  }

  /**
   * Resuelve el idTerceroExterno (cliente) a partir del NIT.
   * TODO (fase live): confirmar el endpoint de terceros y su filtro por NIT.
   */
  private async resolverTercero(nit: string): Promise<number> {
    const res = await fetch(
      `${this.config.baseUrl}/terceros/buscar?identificacion=${encodeURIComponent(nit)}`,
      { headers: this.headers() },
    );
    if (!res.ok) {
      throw new Error(`World Office terceros respondió ${res.status}`);
    }
    const data = (await res.json()) as { id?: number };
    if (typeof data.id !== "number") {
      throw new Error(`No se encontró el tercero con NIT ${nit} en World Office`);
    }
    return data.id;
  }

  /** Envía un documento de venta (pedido o factura) a World Office. */
  private async enviarDocumento(
    orden: Orden,
    documentoTipo: string,
  ): Promise<ResultadoWorldOffice> {
    const payloadNeutro = construirPayloadWorldOffice(
      orden,
      String(this.config.idEmpresa),
      documentoTipo === this.config.documentoTipo ? "FACTURA_VENTA" : "PEDIDO",
    );

    try {
      const [idTerceroExterno, idInventarioPorCodigo] = await Promise.all([
        this.resolverTercero(orden.clienteNit),
        this.resolverInventario(orden.lineas.map((l) => l.codigo)),
      ]);

      const documento = aDocumentoVentaWO(
        orden,
        { ...this.config, documentoTipo },
        { idTerceroExterno, idInventarioPorCodigo },
      );

      const res = await fetch(
        `${this.config.baseUrl}/documentos/editarDocumentoVenta`,
        { method: "PUT", headers: this.headers(), body: JSON.stringify(documento) },
      );

      if (!res.ok) {
        return {
          ok: false,
          documentoId: null,
          mensaje: `World Office respondió ${res.status}: ${await res.text()}`,
          payloadEnviado: payloadNeutro,
        };
      }

      const data = (await res.json()) as { id?: number };
      return {
        ok: true,
        documentoId: data.id != null ? String(data.id) : null,
        mensaje: "Documento creado en World Office.",
        payloadEnviado: payloadNeutro,
      };
    } catch (e) {
      return {
        ok: false,
        documentoId: null,
        mensaje: e instanceof Error ? e.message : "Error al enviar a World Office.",
        payloadEnviado: payloadNeutro,
      };
    }
  }

  async crearPedido(orden: Orden): Promise<ResultadoWorldOffice> {
    return this.enviarDocumento(orden, this.config.documentoTipoPedido);
  }

  async convertirEnFactura(orden: Orden): Promise<ResultadoWorldOffice> {
    return this.enviarDocumento(orden, this.config.documentoTipo);
  }

  /** Inventario "crudo" tal como lo devuelve World Office (uso interno). */
  private async consultarInventarioCrudo(
    codigos: string[],
  ): Promise<Array<{ codigo: string; idInventario: number; disponible: number }>> {
    // TODO (fase live): confirmar ruta y forma de respuesta del listado de
    // inventario, y si admite filtrar por códigos o exige traer y filtrar.
    const res = await fetch(
      `${this.config.baseUrl}/inventario/listar?codigos=${codigos.join(",")}`,
      { headers: this.headers() },
    );
    if (!res.ok) {
      throw new Error(`World Office inventario respondió ${res.status}`);
    }
    return (await res.json()) as Array<{
      codigo: string;
      idInventario: number;
      disponible: number;
    }>;
  }

  async consultarInventario(codigos: string[]): Promise<InventarioVivo[]> {
    const crudo = await this.consultarInventarioCrudo(codigos);
    const ahora = new Date().toISOString();
    return crudo.map((i) => ({
      codigo: i.codigo,
      disponible: i.disponible,
      consultadoEn: ahora,
    }));
  }
}
