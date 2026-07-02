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
 * Robustez (timeout, reintentos, backoff, Retry-After) vive en `http-wo.ts`.
 * Las rutas de los servicios cuyo nombre exacto se confirma contra la cuenta
 * real son CONFIGURABLES por variable de entorno: ajustar la integración = tocar
 * `.env`, no el código.
 *
 * Detalles reales de la API:
 *   - Base:  https://api.worldoffice.cloud/api/v1
 *   - Auth:  header  Authorization: WO <token>   (NO es Bearer)
 *   - Venta: PUT /documentos/editarDocumentoVenta  (sin id = crear; con id = editar)
 */

import type { Orden } from "@/domain/tipos";
import type {
  ClienteWorldOffice,
  InventarioVivo,
  ResultadoWorldOffice,
} from "./contrato";
import { HttpWorldOffice } from "./http-wo";
import { aDocumentoVentaWO, type ConfigDocumentoWO } from "./mapeo-wo";
import { construirPayloadWorldOffice } from "./payload";
import type { DocumentoVentaWO } from "./tipos-wo";

/** Rutas de los servicios de World Office (configurables por entorno). */
export interface RutasWorldOffice {
  /** Crear/editar documento de venta (pedido o factura). */
  documentoVenta: string;
  /** Listar inventario para resolver código contable → idInventario. */
  inventario: string;
  /** Buscar tercero (cliente) por identificación (NIT). */
  terceros: string;
  /** Buscar un documento por referencia externa (idempotencia). */
  buscarDocumento: string;
}

/** Rutas por defecto según la documentación pública. Se confirman contra la cuenta real. */
export const RUTAS_WO_DEFECTO: RutasWorldOffice = {
  documentoVenta: "/documentos/editarDocumentoVenta",
  inventario: "/inventario/listar",
  terceros: "/terceros/buscar",
  buscarDocumento: "/documentos/buscarPorReferencia",
};

export interface ConfigWorldOfficeLive extends ConfigDocumentoWO {
  baseUrl: string;
  token: string;
  /** Tipo de documento para pedidos (los pedidos usan su propio código). */
  documentoTipoPedido: string;
  /** Rutas de los servicios (permite confirmar sin tocar código). */
  rutas: RutasWorldOffice;
  timeoutMs: number;
  maxReintentos: number;
}

/** Forma cruda de un ítem de inventario tal como lo devuelve World Office. */
interface ItemInventarioWO {
  codigo: string;
  idInventario: number;
  disponible: number;
}

export class ClienteWorldOfficeLive implements ClienteWorldOffice {
  private readonly http: HttpWorldOffice;

  constructor(private readonly config: ConfigWorldOfficeLive) {
    this.http = new HttpWorldOffice({
      baseUrl: config.baseUrl,
      token: config.token,
      timeoutMs: config.timeoutMs,
      maxReintentos: config.maxReintentos,
    });
  }

  /**
   * Resuelve el idInventario de World Office para cada código contable.
   * El código contable es la LLAVE: se conserva siempre aunque el vendedor
   * busque por descripción, y aquí traduce al id numérico que exige la API.
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

  /** Resuelve el idTerceroExterno (cliente) a partir del NIT. */
  private async resolverTercero(nit: string): Promise<number> {
    const data = await this.http.peticion<{ id?: number }>(
      "GET",
      `${this.config.rutas.terceros}?identificacion=${encodeURIComponent(nit)}`,
    );
    if (!data || typeof data.id !== "number") {
      throw new Error(`No se encontró el tercero con NIT ${nit} en World Office`);
    }
    return data.id;
  }

  /**
   * Idempotencia: busca un documento ya creado con nuestra referencia externa
   * (el consecutivo de la plataforma). Evita duplicar si se reintenta un envío.
   * Devuelve el id del documento existente, o null si no existe.
   */
  private async buscarDocumentoExistente(
    referencia: string,
  ): Promise<number | null> {
    try {
      const data = await this.http.peticion<{ id?: number } | null>(
        "GET",
        `${this.config.rutas.buscarDocumento}?referenciaExterna=${encodeURIComponent(referencia)}`,
      );
      return data && typeof data.id === "number" ? data.id : null;
    } catch {
      // Si el servicio de búsqueda no está disponible, no bloqueamos el envío;
      // seguimos sin idempotencia (se registra el intento de todas formas).
      return null;
    }
  }

  /**
   * Envía un documento de venta (pedido o factura) a World Office.
   * @param idExistente  Si viene, EDITA ese documento (p. ej. pedido → factura)
   *                     en lugar de crear uno nuevo.
   */
  private async enviarDocumento(
    orden: Orden,
    documentoTipo: string,
    idExistente?: number,
  ): Promise<ResultadoWorldOffice> {
    const payloadNeutro = construirPayloadWorldOffice(
      orden,
      String(this.config.idEmpresa),
      documentoTipo === this.config.documentoTipo ? "FACTURA_VENTA" : "PEDIDO",
    );

    try {
      // Idempotencia: si es una creación y ya existe el documento, no duplicar.
      if (idExistente === undefined) {
        const yaExiste = await this.buscarDocumentoExistente(orden.consecutivo);
        if (yaExiste !== null) {
          return {
            ok: true,
            documentoId: String(yaExiste),
            mensaje: `El documento ya existía en World Office (ref. ${orden.consecutivo}); no se duplicó.`,
            payloadEnviado: payloadNeutro,
          };
        }
      }

      const [idTerceroExterno, idInventarioPorCodigo] = await Promise.all([
        this.resolverTercero(orden.clienteNit),
        this.resolverInventario(orden.lineas.map((l) => l.codigo)),
      ]);

      const documento: DocumentoVentaWO = {
        ...aDocumentoVentaWO(
          orden,
          { ...this.config, documentoTipo },
          { idTerceroExterno, idInventarioPorCodigo },
        ),
        ...(idExistente !== undefined ? { id: idExistente } : {}),
      };

      const data = await this.http.peticion<{ id?: number }>(
        "PUT",
        this.config.rutas.documentoVenta,
        documento,
      );

      return {
        ok: true,
        documentoId: data?.id != null ? String(data.id) : null,
        mensaje:
          idExistente !== undefined
            ? "Documento convertido en World Office."
            : "Documento creado en World Office.",
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
    // Si el pedido ya tiene documento en World Office, se EDITA ese mismo
    // documento a factura en vez de crear uno nuevo (evita duplicados).
    const idPedido = orden.worldOfficeDocId
      ? Number(orden.worldOfficeDocId)
      : undefined;
    const idExistente = Number.isFinite(idPedido) ? idPedido : undefined;
    return this.enviarDocumento(orden, this.config.documentoTipo, idExistente);
  }

  /** Inventario "crudo" tal como lo devuelve World Office (uso interno). */
  private async consultarInventarioCrudo(
    codigos: string[],
  ): Promise<ItemInventarioWO[]> {
    const data = await this.http.peticion<ItemInventarioWO[]>(
      "GET",
      `${this.config.rutas.inventario}?codigos=${encodeURIComponent(codigos.join(","))}`,
    );
    return data ?? [];
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
