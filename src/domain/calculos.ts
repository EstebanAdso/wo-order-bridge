/**
 * Cálculos de totales de una orden.
 *
 * Módulo PURO y reutilizable: lo usa el panel del vendedor para previsualizar
 * en vivo y el backend para persistir. Una sola fórmula = cero discrepancias
 * entre lo que ve el vendedor y lo que se guarda / envía a World Office.
 */

import type { LineaOrden, NuevaLinea, Producto } from "./tipos";

/** Redondea a entero (COP no usa centavos en la operación de E.M.). */
export function redondearPesos(valor: number): number {
  return Math.round(valor);
}

/**
 * Calcula el total de una sola línea aplicando descuento e IVA.
 *
 *   base        = precio * cantidad
 *   conDescuento = base - (base * descuento%)
 *   total        = conDescuento + (conDescuento * iva%)
 */
export function calcularTotalLinea(params: {
  precioUnitario: number;
  cantidad: number;
  descuentoPct: number;
  ivaPct: number;
}): number {
  const base = params.precioUnitario * params.cantidad;
  const conDescuento = base - base * (params.descuentoPct / 100);
  const total = conDescuento + conDescuento * (params.ivaPct / 100);
  return redondearPesos(total);
}

/**
 * Construye una LineaOrden completa (con snapshot del producto) a partir de
 * lo que selecciona el vendedor. `descuentoPctCliente` es el descuento por
 * defecto del cliente; la línea puede sobrescribirlo con `nueva.descuentoPct`.
 */
export function construirLinea(
  producto: Producto,
  nueva: NuevaLinea,
  descuentoPctCliente: number,
): Omit<LineaOrden, "id"> {
  const descuentoPct = nueva.descuentoPct ?? descuentoPctCliente;
  return {
    productoId: producto.id,
    codigo: producto.codigo,
    descripcion: producto.descripcion,
    cantidad: nueva.cantidad,
    precioUnitario: producto.precio,
    descuentoPct,
    ivaPct: producto.ivaPct,
    totalLinea: calcularTotalLinea({
      precioUnitario: producto.precio,
      cantidad: nueva.cantidad,
      descuentoPct,
      ivaPct: producto.ivaPct,
    }),
  };
}

export interface TotalesOrden {
  subtotal: number; // sin IVA, antes de descuento
  descuentoTotal: number;
  iva: number;
  total: number; // a pagar
}

/** Suma las líneas de una orden y devuelve sus totales agregados. */
export function calcularTotales(lineas: Array<Pick<LineaOrden,
  "precioUnitario" | "cantidad" | "descuentoPct" | "ivaPct">>): TotalesOrden {
  let subtotal = 0;
  let descuentoTotal = 0;
  let iva = 0;

  for (const l of lineas) {
    const base = l.precioUnitario * l.cantidad;
    const descuento = base * (l.descuentoPct / 100);
    const conDescuento = base - descuento;
    const ivaLinea = conDescuento * (l.ivaPct / 100);

    subtotal += base;
    descuentoTotal += descuento;
    iva += ivaLinea;
  }

  return {
    subtotal: redondearPesos(subtotal),
    descuentoTotal: redondearPesos(descuentoTotal),
    iva: redondearPesos(iva),
    total: redondearPesos(subtotal - descuentoTotal + iva),
  };
}
