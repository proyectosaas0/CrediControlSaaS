-- El endpoint de cancelar prestamo pedia un motivo pero nunca lo guardaba en
-- la tabla (solo quedaba en audit_logs, invisible desde la UI). Agrega
-- columnas para que el detalle del prestamo pueda mostrar por que y cuando
-- se cancelo.

alter table public.prestamos add column if not exists motivo_cancelacion text;
alter table public.prestamos add column if not exists cancelado_at timestamptz;
