-- ============================================================================
--  Consecutivo de órdenes sin colisiones
--  Una secuencia de Postgres garantiza números únicos aunque varios vendedores
--  creen pedidos a la vez (evita la carrera de "contar y sumar 1").
-- ============================================================================

create sequence if not exists consecutivo_orden_seq;

-- Devuelve el siguiente número de consecutivo. `security definer` para que
-- cualquier usuario autenticado pueda avanzarla sin permisos sobre la secuencia.
create or replace function siguiente_consecutivo()
returns bigint language sql security definer as $$
  select nextval('consecutivo_orden_seq');
$$;

grant execute on function siguiente_consecutivo() to authenticated;
