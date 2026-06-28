/**
 * CONTRATO de integración con World Office Cloud.
 *
 * Define la interfaz que la plataforma usa para hablar con World Office, SIN
 * acoplarse a cómo está implementada. Hay dos implementaciones:
 *
 *   - cliente-mock.ts  → simula la API. Es lo que corre durante el concurso.
 *   - cliente-live.ts  → llamadas HTTP reales. Lo completa el ganador con la
 *                        cuenta real del cliente (el 10% final).
 *
 * Gracias a este contrato, pasar de mock a producción NO toca el resto de la
 * app: solo cambia la variable de entorno WORLDOFFICE_MODE.
 */

import type { Orden } from "@/domain/tipos";
import type { PayloadPedidoWorldOffice } from "./payload";

/** Resultado de crear un documento (pedido/factura) en World Office. */
export interface ResultadoWorldOffice {
  ok: boolean;
  /** Id del documento creado en World Office (ej. "PED-WO-000987"). */
  documentoId: string | null;
  /** Mensaje legible para mostrar/registrar. */
  mensaje: string;
  /** Payload exacto enviado, para auditoría y trazabilidad. */
  payloadEnviado: PayloadPedidoWorldOffice;
}

/** Estado de inventario de un producto consultado en vivo. */
export interface InventarioVivo {
  codigo: string;
  disponible: number;
  consultadoEn: string; // ISO 8601
}

/**
 * Operaciones que la plataforma necesita de World Office Cloud.
 * El plan detallado de cómo se mapea cada una a la API real está en
 * docs/INTEGRACION-WORLD-OFFICE.md.
 */
export interface ClienteWorldOffice {
  /** Crea el pedido en World Office a partir de una orden de la plataforma. */
  crearPedido(orden: Orden): Promise<ResultadoWorldOffice>;

  /** Convierte un pedido existente en factura (acción del área contable). */
  convertirEnFactura(orden: Orden): Promise<ResultadoWorldOffice>;

  /** Consulta el inventario disponible de uno o varios códigos. */
  consultarInventario(codigos: string[]): Promise<InventarioVivo[]>;
}
