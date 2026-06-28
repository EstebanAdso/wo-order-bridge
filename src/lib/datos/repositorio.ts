/**
 * Contrato del repositorio de datos.
 *
 * Toda la app accede a los datos a través de esta interfaz, nunca directamente
 * contra una base concreta. Hay dos implementaciones intercambiables:
 *   - repositorio-memoria.ts  → datos en memoria sembrados (modo demo, corre sin
 *                               configurar nada; es el activo durante el concurso).
 *   - repositorio-supabase.ts → Postgres/Supabase (producción).
 *
 * El cambio demo → producción es transparente: solo cambia la fábrica en
 * `index.ts` según las variables de entorno.
 */

import type {
  Cliente,
  Orden,
  Producto,
  Rol,
  Usuario,
} from "@/domain/tipos";

/** Filtros para listar órdenes desde el panel correspondiente. */
export interface FiltroOrdenes {
  /** Limita a las órdenes de un vendedor (panel del vendedor / filtro contable). */
  vendedorId?: string;
  /** Limita por estado (ej. el contable ve 'pedido'). */
  estado?: Orden["estado"];
}

/** Datos para crear un usuario (lo usa el administrador). */
export interface NuevoUsuario {
  email: string;
  nombre: string;
  rol: Rol;
  /** Clave inicial (en producción la gestiona Supabase Auth). */
  clave: string;
}

/** Datos para crear una orden (lo arma el panel del vendedor). */
export interface NuevaOrden {
  vendedorId: string;
  clienteId: string;
  estado: Extract<Orden["estado"], "cotizacion" | "pedido">;
  lineas: Array<{
    productoId: string;
    cantidad: number;
    descuentoPct?: number;
  }>;
}

export interface Repositorio {
  // --- Productos / catálogo -------------------------------------------------
  /** Busca productos por descripción O por código (no excluyente). */
  buscarProductos(termino: string): Promise<Producto[]>;
  obtenerProducto(id: string): Promise<Producto | null>;
  listarProductos(): Promise<Producto[]>;
  actualizarStock(productoId: string, stock: number): Promise<void>;

  // --- Clientes -------------------------------------------------------------
  listarClientes(): Promise<Cliente[]>;
  obtenerCliente(id: string): Promise<Cliente | null>;

  // --- Órdenes --------------------------------------------------------------
  crearOrden(datos: NuevaOrden): Promise<Orden>;
  obtenerOrden(id: string): Promise<Orden | null>;
  listarOrdenes(filtro?: FiltroOrdenes): Promise<Orden[]>;
  /** Cambia el estado de una orden (cotización→pedido, pedido→facturado). */
  cambiarEstadoOrden(
    id: string,
    estado: Orden["estado"],
    worldOfficeDocId?: string,
  ): Promise<Orden>;

  // --- Usuarios (gestión del administrador) ---------------------------------
  listarUsuarios(): Promise<Usuario[]>;
  crearUsuario(datos: NuevoUsuario): Promise<Usuario>;
  eliminarUsuario(id: string): Promise<void>;

  // --- Autenticación demo ---------------------------------------------------
  /** Valida credenciales y devuelve el usuario, o null si no coinciden. */
  validarCredenciales(email: string, clave: string): Promise<Usuario | null>;
  obtenerUsuario(id: string): Promise<Usuario | null>;
}
