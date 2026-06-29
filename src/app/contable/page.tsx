import { AutoActualizar } from "@/components/AutoActualizar";
import { EnlaceEstructuraWO } from "@/components/EnlaceEstructuraWO";
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
        <div className="flex items-center gap-4">
          <a
            href="/api/worldoffice/estructuras"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-green-500 hover:text-green-700"
          >
            Descargar estructuras WO (lote)
          </a>
          <FiltroVendedor vendedores={vendedores} />
        </div>
      </div>

      <TablaOrdenes
        ordenes={visibles}
        mostrarVendedor
        vacio="No hay pedidos por facturar."
        accion={(o) => (
          <div className="flex items-center justify-end gap-3">
            <EnlaceEstructuraWO ordenId={o.id} />
            {o.estado === "pedido" && <BotonFacturar ordenId={o.id} />}
          </div>
        )}
      />
    </div>
  );
}
