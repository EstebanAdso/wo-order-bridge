/**
 * Implementación MOCK del cliente World Office.
 *
 * Simula el comportamiento de la API real para que toda la plataforma quede
 * funcionando y demostrable durante el concurso, sin tocar la cuenta real.
 * Genera documentos con ids ficticios y registra el payload exacto que se
 * habría enviado, igual que hará la implementación live.
 */

import type { Orden } from "@/domain/tipos";
import type {
  ClienteWorldOffice,
  InventarioVivo,
  ResultadoWorldOffice,
} from "./contrato";
import { construirPayloadWorldOffice } from "./payload";

/** Pequeño retardo para imitar latencia de red y probar estados de carga. */
function simularLatencia(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nuevoDocumentoId(prefijo: string): string {
  const aleatorio = Math.floor(Math.random() * 900000) + 100000;
  return `${prefijo}-WO-${aleatorio}`;
}

export class ClienteWorldOfficeMock implements ClienteWorldOffice {
  constructor(private readonly empresaId: string) {}

  async crearPedido(orden: Orden): Promise<ResultadoWorldOffice> {
    await simularLatencia();
    const payload = construirPayloadWorldOffice(orden, this.empresaId, "PEDIDO");
    return {
      ok: true,
      documentoId: nuevoDocumentoId("PED"),
      mensaje: "Pedido creado en World Office (simulado).",
      payloadEnviado: payload,
    };
  }

  async convertirEnFactura(orden: Orden): Promise<ResultadoWorldOffice> {
    await simularLatencia();
    const payload = construirPayloadWorldOffice(
      orden,
      this.empresaId,
      "FACTURA_VENTA",
    );
    return {
      ok: true,
      documentoId: nuevoDocumentoId("FV"),
      mensaje: "Factura de venta creada en World Office (simulado).",
      payloadEnviado: payload,
    };
  }

  async consultarInventario(codigos: string[]): Promise<InventarioVivo[]> {
    await simularLatencia(200);
    const ahora = new Date().toISOString();
    // En mock, el inventario "en vivo" lo resuelve la capa de datos local.
    // Aquí devolvemos un valor determinístico por código para la demo.
    return codigos.map((codigo) => ({
      codigo,
      disponible: 10 + (Number(codigo.slice(-2)) || 0),
      consultadoEn: ahora,
    }));
  }
}
