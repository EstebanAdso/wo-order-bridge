/**
 * Configuración de marca/identidad de la aplicación.
 *
 * El código NO hardcodea el nombre de ninguna empresa concreta: todo lo
 * específico del cliente se lee desde variables de entorno, con valores por
 * defecto genéricos. Así la plataforma se reutiliza en otro cliente cambiando
 * solo el `.env.local`, sin tocar el código.
 */

/** Nombre comercial de la plataforma (se muestra en la interfaz). */
export const NOMBRE_APP =
  process.env.NEXT_PUBLIC_APP_NAME ?? "Cotizaciones y Pedidos";

/** Nombre de la empresa que opera la plataforma (para documentos y payloads). */
export const NOMBRE_EMPRESA =
  process.env.NEXT_PUBLIC_EMPRESA_NOMBRE ?? "La Empresa";
