/**
 * Mapeo de una Orden interna al documento de venta REAL de World Office.
 *
 * La API de World Office referencia inventario y terceros por ID numérico, no
 * por código contable ni NIT. Por eso este mapeo recibe los IDs ya resueltos
 * (ver `cliente-live.ts`, que los obtiene de los servicios de inventario y
 * terceros). Mantener este paso aislado hace que ajustar el formato al confirmar
 * la cuenta real toque un solo archivo.
 */

import type { Orden } from "@/domain/tipos";
import type { DocumentoVentaWO, ReglonWO } from "./tipos-wo";

/** Valores de configuración contable del cliente (desde variables de entorno). */
export interface ConfigDocumentoWO {
  idEmpresa: number;
  /** Tercero interno: responsable/vendedor en World Office. */
  idTerceroInterno: number;
  idFormaPago: number;
  idMoneda: number;
  idBodega: number;
  /** Código del tipo de documento a crear (ej. "FV", "PD"). */
  documentoTipo: string;
}

/** IDs resueltos contra World Office necesarios para armar el documento. */
export interface IdsResueltos {
  /** ID del cliente (tercero externo) en World Office. */
  idTerceroExterno: number;
  /** Mapa código contable → idInventario de World Office. */
  idInventarioPorCodigo: Map<string, number>;
}

/** Convierte una orden interna en el cuerpo que espera World Office. */
export function aDocumentoVentaWO(
  orden: Orden,
  config: ConfigDocumentoWO,
  ids: IdsResueltos,
): DocumentoVentaWO {
  const reglones: ReglonWO[] = orden.lineas.map((l) => {
    const idInventario = ids.idInventarioPorCodigo.get(l.codigo);
    if (idInventario === undefined) {
      throw new Error(
        `No se encontró el idInventario de World Office para el código ${l.codigo}`,
      );
    }
    return {
      idInventario,
      unidadMedida: "und", // World Office toma la unidad del propio ítem de inventario
      cantidad: String(l.cantidad),
      valorUnitario: String(l.precioUnitario),
      idBodega: config.idBodega,
      porDescuento: l.descuentoPct,
      concepto: l.descripcion,
    };
  });

  return {
    fecha: orden.creadaEn.slice(0, 10),
    documentoTipo: config.documentoTipo,
    idEmpresa: config.idEmpresa,
    idTerceroExterno: ids.idTerceroExterno,
    idTerceroInterno: config.idTerceroInterno,
    idFormaPago: config.idFormaPago,
    idMoneda: config.idMoneda,
    trm: "1",
    porcentajeDescuento: true, // el descuento va como porcentaje (porDescuento)
    valDescuento: 0,
    reglones,
    idDetalles: [],
  };
}
