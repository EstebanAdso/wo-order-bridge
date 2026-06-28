-- ============================================================================
--  Migración inicial - Plataforma de Cotizaciones y Pedidos
--  Esquema: usuarios (perfiles), clientes, productos, órdenes y sus líneas.
--  Postgres / Supabase. Ejecutar en el SQL Editor del proyecto.
-- ============================================================================

-- Tipos enumerados del dominio --------------------------------------------------
create type rol_usuario as enum ('vendedor', 'contable', 'administrador');
create type categoria_producto as enum ('sellos_mecanicos', 'capacitores', 'refrigeracion');
create type estado_orden as enum ('cotizacion', 'pedido', 'facturado');

-- Perfiles: extiende auth.users de Supabase con rol y datos del negocio --------
create table perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  nombre      text not null,
  rol         rol_usuario not null default 'vendedor',
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

-- Clientes a los que se cotiza -------------------------------------------------
create table clientes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  nit           text not null unique,
  email         text,
  descuento_pct numeric(5,2) not null default 0 check (descuento_pct between 0 and 100),
  creado_en     timestamptz not null default now()
);

-- Catálogo de productos. `codigo` = código contable que viaja a World Office ---
create table productos (
  id          text primary key,            -- 'prod-<codigo>' (estable, ver catalogo.ts)
  codigo      text not null unique,
  descripcion text not null,
  categoria   categoria_producto not null,
  marca       text not null,
  unidad      text not null default 'UND',
  precio      numeric(14,2) not null check (precio >= 0),
  iva_pct     numeric(5,2) not null default 19,
  stock       integer not null default 0,
  activo      boolean not null default true
);

-- Índice para búsqueda por descripción (insensible a acentos/mayúsculas) -------
create extension if not exists pg_trgm;
create index idx_productos_descripcion on productos using gin (descripcion gin_trgm_ops);
create index idx_productos_codigo on productos (codigo);

-- Órdenes: cotización → pedido → facturado -------------------------------------
create table ordenes (
  id                uuid primary key default gen_random_uuid(),
  consecutivo       text not null unique,
  estado            estado_orden not null default 'cotizacion',
  vendedor_id       uuid not null references perfiles (id),
  cliente_id        uuid not null references clientes (id),
  subtotal          numeric(14,2) not null default 0,
  descuento_total   numeric(14,2) not null default 0,
  iva               numeric(14,2) not null default 0,
  total             numeric(14,2) not null default 0,
  world_office_doc_id text,
  creada_en         timestamptz not null default now(),
  actualizada_en    timestamptz not null default now()
);

create index idx_ordenes_estado on ordenes (estado, creada_en desc);
create index idx_ordenes_vendedor on ordenes (vendedor_id, creada_en desc);

-- Líneas de cada orden (snapshot del producto al momento de cotizar) -----------
create table orden_lineas (
  id               uuid primary key default gen_random_uuid(),
  orden_id         uuid not null references ordenes (id) on delete cascade,
  producto_id      text not null references productos (id),
  codigo           text not null,           -- código contable congelado
  descripcion      text not null,
  cantidad         integer not null check (cantidad > 0),
  precio_unitario  numeric(14,2) not null,
  descuento_pct    numeric(5,2) not null default 0,
  iva_pct          numeric(5,2) not null default 19,
  total_linea      numeric(14,2) not null
);

create index idx_orden_lineas_orden on orden_lineas (orden_id);

-- Mantiene actualizada_en al modificar una orden -------------------------------
create or replace function tocar_actualizada_en()
returns trigger language plpgsql as $$
begin
  new.actualizada_en = now();
  return new;
end;
$$;

create trigger trg_ordenes_actualizada
  before update on ordenes
  for each row execute function tocar_actualizada_en();
