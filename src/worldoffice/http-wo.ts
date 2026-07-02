/**
 * Cliente HTTP robusto para World Office Cloud.
 *
 * Aísla la parte "de red" de la integración: autenticación, timeout, reintentos
 * con backoff y respeto de `Retry-After`. `cliente-live.ts` lo usa para TODAS
 * sus llamadas, de modo que la robustez que promete el plan de integración
 * (docs/INTEGRACION-WORLD-OFFICE.md §7) viva en un solo lugar y no se repita.
 *
 * Por qué separado: la lógica de negocio (mapear una Orden a un documento) no
 * debe mezclarse con detalles de transporte (headers, timeouts, backoff).
 */

/** Ajustes de red configurables desde variables de entorno. */
export interface OpcionesHttpWO {
  baseUrl: string;
  token: string;
  /** Milisegundos antes de abortar una petición colgada. */
  timeoutMs: number;
  /** Número máximo de intentos ante errores transitorios (5xx, 429, red). */
  maxReintentos: number;
}

/** Error de transporte con el código HTTP y el cuerpo, para reportar sin romper. */
export class ErrorWorldOffice extends Error {
  constructor(
    readonly status: number,
    readonly cuerpo: string,
  ) {
    super(`World Office respondió ${status}: ${cuerpo}`);
    this.name = "ErrorWorldOffice";
  }
}

/** Códigos HTTP que vale la pena reintentar (errores transitorios). */
function esTransitorio(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

/** Espera `ms` milisegundos (para el backoff entre reintentos). */
function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calcula cuánto esperar antes del siguiente intento.
 * Si el servidor envía `Retry-After` (segundos), lo respeta; si no, aplica
 * backoff exponencial: 1s, 3s, 9s...
 */
function calcularEspera(intento: number, retryAfter: string | null): number {
  if (retryAfter) {
    const segundos = Number(retryAfter);
    if (Number.isFinite(segundos) && segundos >= 0) return segundos * 1000;
  }
  return 1000 * 3 ** intento;
}

export class HttpWorldOffice {
  constructor(private readonly opciones: OpcionesHttpWO) {}

  /** Cabeceras estándar: auth con prefijo "WO" (NO Bearer) y JSON. */
  private headers(): Record<string, string> {
    return {
      Authorization: `WO ${this.opciones.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Ejecuta una petición con timeout y reintentos con backoff.
   * Lanza `ErrorWorldOffice` si tras agotar los intentos sigue fallando.
   * @returns el cuerpo ya parseado como JSON (o `null` si no hay cuerpo).
   */
  async peticion<T>(
    metodo: "GET" | "POST" | "PUT" | "DELETE",
    ruta: string,
    cuerpo?: unknown,
  ): Promise<T> {
    const url = `${this.opciones.baseUrl}${ruta}`;
    let ultimoError: unknown;

    for (let intento = 0; intento <= this.opciones.maxReintentos; intento++) {
      const abort = new AbortController();
      const temporizador = setTimeout(
        () => abort.abort(),
        this.opciones.timeoutMs,
      );

      try {
        const res = await fetch(url, {
          method: metodo,
          headers: this.headers(),
          body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
          signal: abort.signal,
        });

        if (res.ok) {
          const texto = await res.text();
          return (texto ? JSON.parse(texto) : null) as T;
        }

        // Error HTTP: reintentar solo si es transitorio y quedan intentos.
        if (esTransitorio(res.status) && intento < this.opciones.maxReintentos) {
          await esperar(calcularEspera(intento, res.headers.get("Retry-After")));
          continue;
        }
        throw new ErrorWorldOffice(res.status, await res.text());
      } catch (e) {
        ultimoError = e;
        // Un ErrorWorldOffice no transitorio no se reintenta: se propaga.
        if (e instanceof ErrorWorldOffice) throw e;
        // Error de red / timeout: reintentar si quedan intentos.
        if (intento < this.opciones.maxReintentos) {
          await esperar(calcularEspera(intento, null));
          continue;
        }
      } finally {
        clearTimeout(temporizador);
      }
    }

    throw ultimoError instanceof Error
      ? ultimoError
      : new Error("Fallo de red al llamar a World Office.");
  }
}
