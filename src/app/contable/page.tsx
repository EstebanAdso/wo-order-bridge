import { AutoActualizar } from "@/components/AutoActualizar";
import { TablaOrdenes } from "@/components/TablaOrdenes";
import { requerirRol } from "@/lib/auth/sesion";
import { obtenerRepositorio } from "@/lib/datos";
import { BotonFacturar } from "./BotonFacturar";
import { FiltroVendedor } from "./FiltroVendedor";

/** Panel contable: pedidos en tiempo real, filtrables por vendedor, a facturar. */
export default async function PaginaContable({
  searchParams,
}: {
  searchParams: Promise<{ vendedor?: string }>;
}) {
  await requerirRol("contable");
  const { vendedor } = await searchParams;
  const repo = obtenerRepositorio();

  const [ordenes, usuarios] = await Promise.all([
    repo.listarOrdenes({ vendedorId: vendedor || undefined }),
    repo.listarUsuarios(),
  ]);

  // El contable solo gestiona pedidos y su historial de facturados.
  const visibles = ordenes.filter(
    (o) => o.estado === "pedido" || o.estado === "facturado",
  );
  const vendedores = usuarios.filter((u) => u.rol === "vendedor");

  return (
    <div className="space-y-6">
      <AutoActualizar />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">
          Pedidos en tiempo real
        </h1>
        <FiltroVendedor vendedores={vendedores} />
      </div>

      <TablaOrdenes
        ordenes={visibles}
        mostrarVendedor
        vacio="No hay pedidos por facturar."
        accion={(o) =>
          o.estado === "pedido" ? <BotonFacturar ordenId={o.id} /> : null
        }
      />
    </div>
  );
}
