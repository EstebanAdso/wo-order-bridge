/**
 * Utilidades de formato compartidas por toda la interfaz.
 * Centralizar el formato evita inconsistencias (un solo estilo de moneda/fecha).
 */

const FORMATO_COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea un valor en pesos colombianos: 38500 → "$ 38.500". */
export function formatearPesos(valor: number): string {
  return FORMATO_COP.format(valor);
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Formatea una fecha ISO a texto legible en español. */
export function formatearFecha(iso: string): string {
  return FORMATO_FECHA.format(new Date(iso));
}
