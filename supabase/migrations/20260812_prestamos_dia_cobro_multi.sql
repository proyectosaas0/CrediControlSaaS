-- dia_cobro now supports multiple values and, besides a weekday, specific
-- day-of-month numbers (e.g. clients paid quincenalmente who only pay on
-- the 15th and 30th). Still purely informational, doesn't affect
-- cronograma_pagos generation.

create or replace function public.valid_dia_cobro(vals text[])
returns boolean
language sql
immutable
as $$
  select vals is null or (
    array_length(vals, 1) > 0
    and not exists (
      select 1 from unnest(vals) as d
      where not (
        d = any (array['lunes','martes','miercoles','jueves','viernes','sabado','domingo'])
        or d ~ '^([1-9]|[12][0-9]|3[01])$'
      )
    )
  )
$$;

alter table public.prestamos drop constraint if exists prestamos_dia_cobro_check;

alter table public.prestamos alter column dia_cobro type text[]
  using (case when dia_cobro is null then null else array[dia_cobro] end);

alter table public.prestamos add constraint prestamos_dia_cobro_check
  check (public.valid_dia_cobro(dia_cobro));
