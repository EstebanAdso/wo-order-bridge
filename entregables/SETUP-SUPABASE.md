# Puesta en marcha con Supabase (persistencia + login real)

La plataforma corre en dos modos, sin cambiar código:

- **`DATA_MODE=demo`** (por defecto): datos en memoria y login por cookie. Ideal
  para probar sin configurar nada.
- **`DATA_MODE=supabase`**: base de datos Postgres real y **login con correo y
  contraseña** vía Supabase Auth. Es el modo de producción.

Esta guía activa el modo Supabase paso a paso.

---

## 1. Crear el proyecto Supabase

1. Entra a <https://supabase.com> → **New project**.
2. Anota la contraseña de la base y espera a que termine de aprovisionar.
3. En **Project Settings → API** copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secreta) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Crear las tablas (migraciones)

En el **SQL Editor** de Supabase, ejecuta en orden el contenido de:

1. `supabase/migrations/0001_inicial.sql` — tablas y tipos.
2. `supabase/migrations/0002_rls.sql` — seguridad por rol (RLS).
3. `supabase/migrations/0003_consecutivo.sql` — consecutivos sin colisiones.

## 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y rellena, como mínimo:

```env
DATA_MODE="supabase"
NEXT_PUBLIC_SUPABASE_URL="https://TU-PROYECTO.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

SEED_ADMIN_EMAIL="admin@tu-empresa.com"
SEED_ADMIN_PASSWORD="una-clave-fuerte"
SEED_ADMIN_NOMBRE="Administrador"
```

## 4. Sembrar catálogo, clientes y administrador

```bash
npm run seed:supabase
```

Esto carga los productos de muestra, los clientes de ejemplo y crea el **primer
usuario administrador** con las credenciales `SEED_ADMIN_*`. El script es
idempotente: si el administrador ya existe, no lo recrea.

## 5. Entrar y crear al resto del equipo

1. `npm run dev` → entra en `/login` con el correo y contraseña del administrador.
2. En el **panel de administrador**, crea vendedores y contables. Cada creación:
   - registra la cuenta en Supabase Auth con la contraseña que indiques, y
   - crea su perfil con el rol correspondiente.
3. Entrega a cada persona su correo y contraseña. Puede cambiarla luego.

> **Cómo se crean las cuentas.** Hoy el administrador fija una contraseña inicial
> al crear la cuenta (funciona sin configurar correo saliente). Si prefieres que
> cada usuario reciba una invitación por correo y fije su propia contraseña,
> Supabase lo soporta con `inviteUserByEmail`: basta configurar el SMTP del
> proyecto (Authentication → Email) y cambiar una línea en
> `crearUsuario` (`src/lib/datos/repositorio-supabase.ts`).

---

## Cómo encaja con el resto

- **RLS** garantiza que cada rol vea solo lo que le corresponde, incluso si
  alguien llamara la API directamente: el vendedor solo sus órdenes; contable y
  administrador, todas (`supabase/migrations/0002_rls.sql`).
- El **mismo contrato de datos** (`Repositorio`) sirve para demo y Supabase, así
  que los paneles no cambian entre modos.
- La integración con **World Office** es independiente de este modo: se activa
  aparte con `WORLDOFFICE_MODE=live` (ver `INTEGRACION-WORLD-OFFICE.md`).
