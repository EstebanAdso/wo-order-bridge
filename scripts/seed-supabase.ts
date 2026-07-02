/**
 * Siembra un proyecto Supabase recién creado con lo mínimo para operar:
 *   - Catálogo de productos (desde src/data/catalogo.ts).
 *   - Clientes de ejemplo con su descuento (desde datos-demo.ts).
 *   - El primer usuario ADMINISTRADOR (para que luego cree al resto).
 *
 * Requiere ejecutar antes las migraciones (supabase/migrations/*.sql) en el
 * SQL Editor del proyecto. Lee la configuración de `.env.local`.
 *
 * Uso:  npm run seed:supabase
 *
 * Variables necesarias en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NOMBRE (opcional)
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { CATALOGO, idDesdeCodigo } from "../src/data/catalogo.ts";
import { CLIENTES_DEMO } from "../src/lib/datos/datos-demo.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Carga .env.local a process.env (tsx no lo hace por sí solo). */
function cargarEnvLocal(): void {
  try {
    const ruta = resolve(__dirname, "../.env.local");
    const contenido = readFileSync(ruta, "utf8");
    for (const linea of contenido.split("\n")) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith("#")) continue;
      const igual = limpia.indexOf("=");
      if (igual === -1) continue;
      const clave = limpia.slice(0, igual).trim();
      let valor = limpia.slice(igual + 1).trim();
      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1);
      }
      if (!(clave in process.env)) process.env[clave] = valor;
    }
  } catch {
    // Sin .env.local: se asume que las variables ya están en el entorno.
  }
}

function requerir(clave: string): string {
  const valor = process.env[clave];
  if (!valor) {
    console.error(`Falta la variable ${clave} en .env.local`);
    process.exit(1);
  }
  return valor;
}

async function main(): Promise<void> {
  cargarEnvLocal();

  const url = requerir("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requerir("SUPABASE_SERVICE_ROLE_KEY");
  const adminEmail = requerir("SEED_ADMIN_EMAIL");
  const adminPassword = requerir("SEED_ADMIN_PASSWORD");
  const adminNombre = process.env.SEED_ADMIN_NOMBRE ?? "Administrador";

  const sb = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Productos ------------------------------------------------------------
  const productos = CATALOGO.map((p) => ({
    id: idDesdeCodigo(p.codigo),
    codigo: p.codigo,
    descripcion: p.descripcion,
    categoria: p.categoria,
    marca: p.marca,
    unidad: p.unidad,
    precio: p.precio,
    iva_pct: p.ivaPct,
    stock: p.stock,
    activo: true,
  }));
  const { error: errProd } = await sb
    .from("productos")
    .upsert(productos, { onConflict: "id" });
  if (errProd) throw new Error(`Productos: ${errProd.message}`);
  console.log(`✓ ${productos.length} productos sembrados`);

  // 2) Clientes -------------------------------------------------------------
  const clientes = CLIENTES_DEMO.map((c) => ({
    nombre: c.nombre,
    nit: c.nit,
    email: c.email,
    descuento_pct: c.descuentoPct,
  }));
  const { error: errCli } = await sb
    .from("clientes")
    .upsert(clientes, { onConflict: "nit" });
  if (errCli) throw new Error(`Clientes: ${errCli.message}`);
  console.log(`✓ ${clientes.length} clientes sembrados`);

  // 3) Administrador inicial ------------------------------------------------
  const { data: existente } = await sb
    .from("perfiles")
    .select("id")
    .eq("email", adminEmail)
    .maybeSingle();

  if (existente) {
    console.log(`• El administrador ${adminEmail} ya existe; no se recrea`);
  } else {
    const { data: creado, error: errAuth } = await sb.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { nombre: adminNombre },
    });
    if (errAuth || !creado.user) {
      throw new Error(`Auth admin: ${errAuth?.message ?? "sin usuario"}`);
    }
    const { error: errPerfil } = await sb.from("perfiles").insert({
      id: creado.user.id,
      email: adminEmail,
      nombre: adminNombre,
      rol: "administrador",
      activo: true,
    });
    if (errPerfil) {
      await sb.auth.admin.deleteUser(creado.user.id);
      throw new Error(`Perfil admin: ${errPerfil.message}`);
    }
    console.log(`✓ Administrador creado: ${adminEmail}`);
  }

  console.log("\nSeed completado. Ya puedes entrar con el administrador.");
}

main().catch((e) => {
  console.error("Error en el seed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
