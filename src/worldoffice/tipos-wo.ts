/**
 * Tipos REALES de la API de World Office Cloud.
 *
 * Basados en la documentación pública (https://devapidoc.worldoffice.cloud,
 * https://developer.worldoffice.cloud). A diferencia de nuestro payload neutro
 * (`payload.ts`), aquí los campos coinciden con lo que espera la API real:
 * IDs numéricos, `documentoTipo` por código y `reglones` (tal cual, sin "n").
 *
 * Los valores que dependen de la configuración contable del cliente (empresa,
 * forma de pago, moneda, bodega, tipos de documento) NO se inventan: vienen de
 * variables de entorno y se confirman contra la cuenta real.
 */

/** Renglón de un documento de venta en formato World Office. */
export interface ReglonWO {
  /** ID numérico del ítem en el inventario de World Office (no el código contable). */
  idInventario: number;
  unidadMedida: string;
  cantidad: string;
  valorUnitario: string;
  idBodega: number;
  porDescuento: number;
  concepto: string;
}

/** Cuerpo para crear/editar un documento de venta (PUT editarDocumentoVenta). */
export interface DocumentoVentaWO {
  /** Id del documento. Se omite (o 0) al crear; se incluye al editar. */
  id?: number;
  fecha: string; // YYYY-MM-DD
  /** Código del tipo de documento, ej. "FV" (factura de venta). */
  documentoTipo: string;
  idEmpresa: number;
  /** Tercero externo = cliente. */
  idTerceroExterno: number;
  /** Tercero interno = vendedor/responsable. */
  idTerceroInterno: number;
  idFormaPago: number;
  idMoneda: number;
  trm: string;
  porcentajeDescuento: boolean;
  valDescuento: number;
  reglones: ReglonWO[];
  idDetalles: unknown[];
}

/** Respuesta del servicio de token (gestionarTokenAPILicencia). */
export interface RespuestaTokenWO {
  token: string;
}
