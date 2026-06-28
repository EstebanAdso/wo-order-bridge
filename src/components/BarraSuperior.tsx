import { NOMBRE_APP } from "@/config/app";
import type { Usuario } from "@/domain/tipos";
import { ETIQUETA_ROL } from "@/lib/roles";
import { accionCerrarSesion } from "@/app/acciones-sesion";

/** Barra superior común a los tres paneles: marca, usuario y cerrar sesión. */
export function BarraSuperior({ usuario }: { usuario: Usuario }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-green-800">{NOMBRE_APP}</span>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            {ETIQUETA_ROL[usuario.rol]}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{usuario.nombre}</span>
          <form action={accionCerrarSesion}>
            <button
              type="submit"
              className="text-sm font-medium text-slate-500 transition hover:text-red-600"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
