-- ============================================================================
--  Seguridad a nivel de fila (RLS) - acceso por rol
--  Plataforma cerrada: solo usuarios autenticados, y cada rol ve lo que le toca.
-- ============================================================================

-- Función auxiliar: rol del usuario autenticado actual ------------------------
create or replace function rol_actual()
returns rol_usuario language sql stable security definer as $$
  select rol from perfiles where id = auth.uid();
$$;

alter table perfiles      enable row level security;
alter table clientes      enable row level security;
alter table productos     enable row level security;
alter table ordenes       enable row level security;
alter table orden_lineas  enable row level security;

-- Perfiles ---------------------------------------------------------------------
-- Cada quien ve su propio perfil; el administrador ve y gestiona todos.
create policy perfiles_lectura on perfiles for select
  using (id = auth.uid() or rol_actual() = 'administrador');

create policy perfiles_admin_escritura on perfiles for all
  using (rol_actual() = 'administrador')
  with check (rol_actual() = 'administrador');

-- Clientes ---------------------------------------------------------------------
-- Cualquier usuario autenticado consulta clientes; admin los gestiona.
create policy clientes_lectura on clientes for select
  using (auth.uid() is not null);

create policy clientes_admin_escritura on clientes for all
  using (rol_actual() = 'administrador')
  with check (rol_actual() = 'administrador');

-- Productos --------------------------------------------------------------------
-- Catálogo visible para todos los autenticados; admin gestiona inventario.
create policy productos_lectura on productos for select
  using (auth.uid() is not null);

create policy productos_admin_escritura on productos for all
  using (rol_actual() = 'administrador')
  with check (rol_actual() = 'administrador');

-- Órdenes ----------------------------------------------------------------------
-- Vendedor: ve y edita las suyas. Contable y admin: ven todas.
create policy ordenes_lectura on ordenes for select
  using (
    vendedor_id = auth.uid()
    or rol_actual() in ('contable', 'administrador')
  );

create policy ordenes_vendedor_escritura on ordenes for insert
  with check (vendedor_id = auth.uid() and rol_actual() = 'vendedor');

create policy ordenes_actualizacion on ordenes for update
  using (
    vendedor_id = auth.uid()
    or rol_actual() in ('contable', 'administrador')
  );

-- Líneas de orden: heredan el acceso de su orden -------------------------------
create policy orden_lineas_lectura on orden_lineas for select
  using (
    exists (
      select 1 from ordenes o
      where o.id = orden_lineas.orden_id
        and (o.vendedor_id = auth.uid() or rol_actual() in ('contable', 'administrador'))
    )
  );

create policy orden_lineas_escritura on orden_lineas for all
  using (
    exists (
      select 1 from ordenes o
      where o.id = orden_lineas.orden_id
        and (o.vendedor_id = auth.uid() or rol_actual() = 'administrador')
    )
  )
  with check (
    exists (
      select 1 from ordenes o
      where o.id = orden_lineas.orden_id
        and (o.vendedor_id = auth.uid() or rol_actual() = 'administrador')
    )
  );
