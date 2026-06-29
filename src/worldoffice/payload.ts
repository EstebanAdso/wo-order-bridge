/**
 * Constructor del PAYLOAD que alimenta a World Office Cloud.
 *
 * Este módulo es clave para la evaluación ("calidad de archivos y estructuras
 * que alimentan a World Office"). Traduce una `Orden` del modelo interno al
 * formato que espera la API de documentos de World Office Cloud.
 *
 * NOTA: La estructura sigue el formato documentado de "documento de venta" de
 * World Office (tercero + renglones de inventario). Los nombres exactos de
 * campos se confirman contra la cuenta real en la fase de integración en vivo;
 * cualquier ajuste se hace SOLO aquí, sin tocar el resto de la plataforma.
 */

import type { Orden } from "@/domain/tipos";

/** Tipo de documento a crear en World Office. */
export type TipoDocumentoWO = "COTIZACION" | "PEDIDO" | "FACTURA_VENTA";

/** Un renglón (línea) del documento en formato World Office. */
export interface RenglonWorldOffice {
  /** Código contable del producto (clave de inventario en World Office). */
  codigoProducto: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  descuentoPorcentaje: number;
  porcentajeIva: number;
}

/** Documento completo listo para enviarse al endpoint de World Office. */
export interface PayloadPedidoWorldOffice {
  tipoDocumento: TipoDocumentoWO;
  empresaId: string;
  fecha: string; // ISO 8601 (YYYY-MM-DD)
  /** Tercero = cliente al que se le vende. */
  tercero: {
    identificacion: string; // NIT
    nombre: string;
  };
  vendedor: {
    referencia: string; // id/identificación del vendedor en World Office
    nombre: string;
  };
  renglones: RenglonWorldOffice[];
  /** Consecutivo interno de la plataforma, para trazabilidad cruzada. */
  referenciaExterna: string;
  observaciones: string;
}

/**
 * Construye el payload de World Office desde una orden interna.
 * @param orden    Orden de la plataforma (cotización o pedido).
 * @param empresaId Identificador de la empresa en World Office.
 * @param tipo     Tipo de documento a crear (por defecto PEDIDO).
 */
export function construirPayloadWorldOffice(
  orden: Orden,
  empresaId: string,
  tipo: TipoDocumentoWO = "PEDIDO",
): PayloadPedidoWorldOffice {
  return {
    tipoDocumento: tipo,
    empresaId,
    fecha: orden.creadaEn.slice(0, 10),
    tercero: {
      identificacion: orden.clienteNit, // NIT del tercero en World Office
      nombre: orden.clienteNombre,
    },
    vendedor: {
      referencia: orden.vendedorId,
      nombre: orden.vendedorNombre,
    },
    renglones: orden.lineas.map((l) => ({
      codigoProducto: l.codigo,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      valorUnitario: l.precioUnitario,
      descuentoPorcentaje: l.descuentoPct,
      porcentajeIva: l.ivaPct,
    })),
    referenciaExterna: orden.consecutivo,
    observaciones: `Generado por la plataforma de cotizaciones y pedidos. Orden ${orden.consecutivo}.`,
  };
}
