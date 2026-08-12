-- Some clients only get visited on a specific weekday (e.g. "Elvira paga
-- solo los miercoles") rather than daily. dia_cobro is purely informational
-- for now -- it does not change how cronograma_pagos is generated -- so
-- cobradores can see at a glance which day to visit. NULL keeps today's
-- behavior (daily/as scheduled) for every existing prestamo.

alter table public.prestamos add column if not exists dia_cobro text
  check (dia_cobro is null or dia_cobro in ('lunes','martes','miercoles','jueves','viernes','sabado','domingo'));
