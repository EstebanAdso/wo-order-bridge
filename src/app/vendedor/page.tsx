import { TablaOrdenes } from "@/components/TablaOrdenes";
import { requerirRol } from "@/lib/auth/sesion";
import { obtenerRepositorio } from "@/lib/datos";
import { Cotizador } from "./Cotizador";

/** Panel del vendedor: arma cotizaciones/pedidos y consulta su historial. */
export default async function PaginaVendedor() {
  const vendedor = await requerirRol("vendedor");
  const repo = obtenerRepositorio();
  const [clientes, ordenes] = await Promise.all([
    repo.listarClientes(),
    repo.listarOrdenes({ vendedorId: vendedor.id }),
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Nueva cotización</h1>
        <Cotizador clientes={clientes} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Mi historial</h2>
        <TablaOrdenes ordenes={ordenes} vacio="Aún no has creado órdenes." />
      </section>
    </div>
  );
}
