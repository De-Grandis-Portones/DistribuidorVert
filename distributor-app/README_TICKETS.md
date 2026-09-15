# Tickets del distribuidor — falta un paso manual en Supabase

Esta app no tiene backend propio, así que el botón "Tickets" (ver
`src/components/TicketWidget.jsx` / `src/api/tickets.js`) inserta **directo**
en `public.tickets` usando la clave anon de Supabase (`VITE_SUPABASE_ANON_KEY`)
— la misma tabla compartida que usan Planificación e Integrador desde
`/admin/tickets` (Backend de Planificación, `server/index.js`, migraciones
`tickets` / `tickets_multi_app`).

Para que el insert funcione hace falta correr esto una vez contra el proyecto
de Supabase que usa `distribuidor-vert` (el de `VITE_SUPABASE_URL`) — nadie
del equipo tiene acceso automático a esa base desde este entorno, así que
alguien con acceso al SQL Editor de Supabase tiene que ejecutarlo a mano:

```sql
alter table public.tickets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tickets' and policyname = 'tickets_insert_distribuidor'
  ) then
    create policy "tickets_insert_distribuidor" on public.tickets
      for insert
      to anon
      with check (app_origen = 'distribuidor');
  end if;
end $$;
```

Esto permite que cualquiera que use la app (rol `anon` de PostgREST, ya que
acá no hay sesión de Supabase Auth) **inserte** tickets con
`app_origen = 'distribuidor'`, pero no lea ni edite los tickets de nadie
(no hay policy de `select`/`update`/`delete` para `anon`).

Si `public.tickets` todavía no existe en ese proyecto (por ejemplo si
`distribuidor-vert` usa un proyecto de Supabase distinto al de Planificación/
Integrador/Presupuestador), primero hay que crear la tabla — copiar la
migración `tickets` de `planificacion/Backend/server/index.js`.
