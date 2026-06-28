/**
 * Repositorio en memoria (modo demo).
 *
 * Siembra el catálogo, los usuarios y los clientes de demostración, y mantiene
 * las órdenes en memoria. El estado se guarda en `globalThis` para sobrevivir
 * al hot-reload de Next.js en desarrollo.
 *
 * Reutiliza los cálculos de `domain/calculos.ts`: la misma fórmula que usa el
 * panel del vendedor para previsualizar totales.
 */

import { CATALOGO, idDesdeCodigo } from "@/data/catalogo";
import { calcularTotales, construirLinea } from "@/domain/calculos";
import type {
  Cliente,
  LineaOrden,
  Orden,
  Producto,
  Usuario,
} from "@/domain/tipos";
import { CLIENTES_DEMO, USUARIOS_DEMO, type UsuarioDemo } from "./datos-demo";
import type {
  FiltroOrdenes,
  NuevaOrden,
  NuevoUsuario,
  Repositorio,
} from "./repositorio";

/** Estado mutable del modo demo. */
interface EstadoDemo {
  productos: Producto[];
  usuarios: UsuarioDemo[];
  clientes: Cliente[];
  ordenes: Orden[];
  consecutivo: number;
}

/** Crea el estado inicial sembrado desde el catálogo y los datos demo. */
function sembrarEstado(): EstadoDemo {
  const productos: Producto[] = CATALOGO.map((p) => ({
    id: idDesdeCodigo(p.codigo),
    codigo: p.codigo,
    descripcion: p.descripcion,
    categoria: p.categoria,
    marca: p.marca,
    unidad: p.unidad,
    precio: p.precio,
    ivaPct: p.ivaPct,
    stock: p.stock,
    activo: true,
  }));

  return {
    productos,
    usuarios: USUARIOS_DEMO.map((u) => ({ ...u })),
    clientes: CLIENTES_DEMO.map((c) => ({ ...c })),
    ordenes: [],
    consecutivo: 0,
  };
}

// Singleton sobre globalThis para no perder datos en cada recarga del dev server.
const globalConEstado = globalThis as typeof globalThis & {
  __estadoDemo?: EstadoDemo;
};
const estado: EstadoDemo = (globalConEstado.__estadoDemo ??= sembrarEstado());

/** Normaliza texto para búsquedas: sin acentos, en minúscula. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function quitarClave(u: UsuarioDemo): Usuario {
  const { clave: _clave, ...usuario } = u;
  return usuario;
}

export class RepositorioMemoria implements Repositorio {
  // --- Productos ------------------------------------------------------------
  async buscarProductos(termino: string): Promise<Producto[]> {
    const t = normalizar(termino);
    if (!t) return estado.productos.filter((p) => p.activo);
    return estado.productos.filter(
      (p) =>
        p.activo &&
        (normalizar(p.descripcion).includes(t) ||
          normalizar(p.codigo).includes(t)),
    );
  }

  async obtenerProducto(id: string): Promise<Producto | null> {
    return estado.productos.find((p) => p.id === id) ?? null;
  }

  async listarProductos(): Promise<Producto[]> {
    return [...estado.productos];
  }

  async actualizarStock(productoId: string, stock: number): Promise<void> {
    const producto = estado.productos.find((p) => p.id === productoId);
    if (producto) producto.stock = stock;
  }

  // --- Clientes -------------------------------------------------------------
  async listarClientes(): Promise<Cliente[]> {
    return [...estado.clientes];
  }

  async obtenerCliente(id: string): Promise<Cliente | null> {
    return estado.clientes.find((c) => c.id === id) ?? null;
  }

  // --- Órdenes --------------------------------------------------------------
  async crearOrden(datos: NuevaOrden): Promise<Orden> {
    const vendedor = estado.usuarios.find((u) => u.id === datos.vendedorId);
    const cliente = estado.clientes.find((c) => c.id === datos.clienteId);
    if (!vendedor) throw new Error("Vendedor no encontrado");
    if (!cliente) throw new Error("Cliente no encontrado");

    // Construye las líneas con snapshot del producto y descuento del cliente.
    const lineas: LineaOrden[] = datos.lineas.map((entrada, indice) => {
      const producto = estado.productos.find((p) => p.id === entrada.productoId);
      if (!producto) throw new Error(`Producto ${entrada.productoId} no encontrado`);
      const linea = construirLinea(
        producto,
        { productoId: entrada.productoId, cantidad: entrada.cantidad, descuentoPct: entrada.descuentoPct },
        cliente.descuentoPct,
      );
      return { ...linea, id: `lin-${Date.now()}-${indice}` };
    });

    const totales = calcularTotales(lineas);
    estado.consecutivo += 1;
    const prefijo = datos.estado === "pedido" ? "PED" : "COT";
    const ahora = new Date().toISOString();

    const orden: Orden = {
      id: `ord-${estado.consecutivo}`,
      consecutivo: `${prefijo}-${String(estado.consecutivo).padStart(6, "0")}`,
      estado: datos.estado,
      vendedorId: vendedor.id,
      vendedorNombre: vendedor.nombre,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      lineas,
      subtotal: totales.subtotal,
      descuentoTotal: totales.descuentoTotal,
      iva: totales.iva,
      total: totales.total,
      worldOfficeDocId: null,
      creadaEn: ahora,
      actualizadaEn: ahora,
    };

    estado.ordenes.unshift(orden); // más recientes primero
    return orden;
  }

  async obtenerOrden(id: string): Promise<Orden | null> {
    return estado.ordenes.find((o) => o.id === id) ?? null;
  }

  async listarOrdenes(filtro: FiltroOrdenes = {}): Promise<Orden[]> {
    return estado.ordenes.filter(
      (o) =>
        (!filtro.vendedorId || o.vendedorId === filtro.vendedorId) &&
        (!filtro.estado || o.estado === filtro.estado),
    );
  }

  async cambiarEstadoOrden(
    id: string,
    estadoNuevo: Orden["estado"],
    worldOfficeDocId?: string,
  ): Promise<Orden> {
    const orden = estado.ordenes.find((o) => o.id === id);
    if (!orden) throw new Error("Orden no encontrada");
    orden.estado = estadoNuevo;
    orden.actualizadaEn = new Date().toISOString();
    if (worldOfficeDocId) orden.worldOfficeDocId = worldOfficeDocId;
    // Actualiza el prefijo del consecutivo al pasar a pedido.
    if (estadoNuevo === "pedido" && orden.consecutivo.startsWith("COT-")) {
      orden.consecutivo = orden.consecutivo.replace("COT-", "PED-");
    }
    return orden;
  }

  // --- Usuarios -------------------------------------------------------------
  async listarUsuarios(): Promise<Usuario[]> {
    return estado.usuarios.map(quitarClave);
  }

  async crearUsuario(datos: NuevoUsuario): Promise<Usuario> {
    if (estado.usuarios.some((u) => u.email === datos.email)) {
      throw new Error("Ya existe un usuario con ese correo");
    }
    const nuevo: UsuarioDemo = {
      id: `usr-${Date.now()}`,
      email: datos.email,
      nombre: datos.nombre,
      rol: datos.rol,
      clave: datos.clave,
      activo: true,
      creadoEn: new Date().toISOString(),
    };
    estado.usuarios.push(nuevo);
    return quitarClave(nuevo);
  }

  async eliminarUsuario(id: string): Promise<void> {
    estado.usuarios = estado.usuarios.filter((u) => u.id !== id);
  }

  // --- Autenticación demo ---------------------------------------------------
  async validarCredenciales(email: string, clave: string): Promise<Usuario | null> {
    const u = estado.usuarios.find(
      (x) => x.email === normalizar(email) || x.email === email,
    );
    if (!u || u.clave !== clave || !u.activo) return null;
    return quitarClave(u);
  }

  async obtenerUsuario(id: string): Promise<Usuario | null> {
    const u = estado.usuarios.find((x) => x.id === id);
    return u ? quitarClave(u) : null;
  }
}
