/**
 * Enlace para descargar la estructura World Office (JSON) de una orden.
 * Reutilizable en los paneles contable y administrador.
 */
export function EnlaceEstructuraWO({ ordenId }: { ordenId: string }) {
  return (
    <a
      href={`/api/ordenes/${ordenId}/worldoffice`}
      className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-green-700 hover:underline"
    >
      Estructura WO ↓
    </a>
  );
}
