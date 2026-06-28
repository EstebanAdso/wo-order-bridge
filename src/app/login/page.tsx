import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NOMBRE_APP, NOMBRE_EMPRESA } from "@/config/app";
import { obtenerUsuarioActual } from "@/lib/auth/sesion";
import { RUTA_PANEL } from "@/lib/roles";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = { title: `Iniciar sesión · ${NOMBRE_APP}` };

/** Pantalla de inicio de sesión. Si ya hay sesión, va directo al panel. */
export default async function PaginaLogin() {
  const usuario = await obtenerUsuarioActual();
  if (usuario) redirect(RUTA_PANEL[usuario.rol]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="space-y-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
            {NOMBRE_EMPRESA}
          </p>
          <h1 className="text-2xl font-bold text-green-900">{NOMBRE_APP}</h1>
          <p className="text-sm text-slate-500">Acceso interno por rol</p>
        </header>

        <FormularioLogin />

        <CredencialesDemo />
      </div>
    </main>
  );
}

/** Ayuda visible en modo demo con las credenciales de prueba. */
function CredencialesDemo() {
  const filas = [
    ["Administrador", "admin@demo.com", "admin123"],
    ["Contable", "contable@demo.com", "contable123"],
    ["Vendedor", "vendedor1@demo.com", "vendedor123"],
  ];
  return (
    <details className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
      <summary className="cursor-pointer font-medium text-slate-700">
        Credenciales de prueba (demo)
      </summary>
      <table className="mt-2 w-full">
        <tbody>
          {filas.map(([rol, correo, clave]) => (
            <tr key={correo}>
              <td className="py-0.5 pr-2 font-medium">{rol}</td>
              <td className="py-0.5 pr-2">{correo}</td>
              <td className="py-0.5 text-slate-400">{clave}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
