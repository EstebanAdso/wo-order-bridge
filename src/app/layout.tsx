import type { Metadata } from "next";
import { NOMBRE_APP } from "@/config/app";
import "./globals.css";

export const metadata: Metadata = {
  title: NOMBRE_APP,
  description:
    "Plataforma interna de cotización y pedidos para vendedores, conectada con World Office Cloud.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
