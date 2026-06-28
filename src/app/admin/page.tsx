import { ETIQUETAS_CATEGORIA } from "@/data/catalogo";
import { TablaOrdenes } from "@/components/TablaOrdenes";
import { requerirRol } from "@/lib/auth/sesion";
import { obtenerRepositorio } from "@/lib/datos";
import { ETIQUETA_ROL } from "@/lib/roles";
import { formatearPesos } from "@/lib/formato";
import { BotonEliminarUsuario } from "./BotonEliminarUsuario";
import { EditorStock } from "./EditorStock";
import { FormularioUsuario } from "./FormularioUsuario";

/** Panel administrador: usuarios, inventario y todas las órdenes. */
export default async function PaginaAdmin() {
  const admin = await requerirRol("administrador");
  const repo = obtenerRepositorio();
  const [usuarios, productos, ordenes] = await Promise.all([
    repo.listarUsuarios(),
    repo.listarProductos(),
    repo.listarOrdenes(),
  ]);

  // El administrador gestiona vendedores y contables, no a sí mismo.
  const gestionables = usuarios.filter((u) => u.id !== admin.id);

  return (
    <div className="space-y-12">
      {/* Usuarios */}
      <section className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Usuarios</h1>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <FormularioUsuario />
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Correo</th>
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gestionables.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">{u.nombre}</td>
                  <td className="px-4 py-2 text-slate-500">{u.email}</td>
                  <td className="px-4 py-2">{ETIQUETA_ROL[u.rol]}</td>
                  <td className="px-4 py-2 text-right">
                    <BotonEliminarUsuario id={u.id} nombre={u.nombre} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inventario */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Inventario</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Descripción</th>
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2 text-right">Precio</th>
                <th className="px-4 py-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs">{p.codigo}</td>
                  <td className="px-4 py-2">{p.descripcion}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {ETIQUETAS_CATEGORIA[p.categoria]}
                  </td>
                  <td className="px-4 py-2 text-right">{formatearPesos(p.precio)}</td>
                  <td className="px-4 py-2">
                    <EditorStock productoId={p.id} stockActual={p.stock} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Órdenes */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Todas las órdenes
        </h2>
        <TablaOrdenes ordenes={ordenes} mostrarVendedor />
      </section>
    </div>
  );
}
