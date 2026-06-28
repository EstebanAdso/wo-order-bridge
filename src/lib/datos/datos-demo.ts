/**
 * Datos sembrados para el modo demo.
 *
 * Permiten que la plataforma corra y se pueda probar end-to-end sin configurar
 * Supabase. En producción estos datos viven en la base y los usuarios se
 * autentican contra Supabase Auth.
 */

import type { Cliente, Rol } from "@/domain/tipos";

/** Usuario demo con clave (solo para autenticación de demostración). */
export interface UsuarioDemo {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  clave: string;
  activo: boolean;
  creadoEn: string;
}

const AHORA = "2026-01-15T08:00:00.000Z";

/**
 * Usuarios de demostración (uno por rol, más un segundo vendedor para probar
 * el filtro por vendedor del panel contable). Credenciales visibles a propósito:
 * es un entorno de prueba sin datos reales.
 */
export const USUARIOS_DEMO: UsuarioDemo[] = [
  { id: "usr-admin", email: "admin@demo.com", nombre: "Administrador General", rol: "administrador", clave: "admin123", activo: true, creadoEn: AHORA },
  { id: "usr-contable", email: "contable@demo.com", nombre: "Carolina Contadora", rol: "contable", clave: "contable123", activo: true, creadoEn: AHORA },
  { id: "usr-vendedor-1", email: "vendedor1@demo.com", nombre: "Pedro Vendedor", rol: "vendedor", clave: "vendedor123", activo: true, creadoEn: AHORA },
  { id: "usr-vendedor-2", email: "vendedor2@demo.com", nombre: "Lucía Ventas", rol: "vendedor", clave: "vendedor123", activo: true, creadoEn: AHORA },
];

/** Clientes de demostración, con su descuento pactado. */
export const CLIENTES_DEMO: Cliente[] = [
  { id: "cli-tornillo", nombre: "Ferretería El Tornillo", nit: "900111222-3", email: "compras@eltornillo.com", descuentoPct: 5, creadoEn: AHORA },
  { id: "cli-andina", nombre: "Refrigeración Andina", nit: "901222333-4", email: "pedidos@refriandina.com", descuentoPct: 10, creadoEn: AHORA },
  { id: "cli-valle", nombre: "Industrias del Valle", nit: "830333444-5", email: "abastecimiento@indvalle.com", descuentoPct: 0, creadoEn: AHORA },
];
