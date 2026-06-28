import { BarraSuperior } from "@/components/BarraSuperior";
import { requerirRol } from "@/lib/auth/sesion";

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await requerirRol("administrador");
  return (
    <div className="min-h-screen">
      <BarraSuperior usuario={usuario} />
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
