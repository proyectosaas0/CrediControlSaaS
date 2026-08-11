-- Permite registrar un pago "abono" que no esta atado a una cuota puntual del
-- cronograma. El monto se reparte automaticamente contra las cuotas pendientes
-- o parciales mas proximas (por numero_cuota ascendente), marcandolas pagadas
-- o parciales segun alcance -- equivalente a que el cliente pague varios dias
-- de una sola vez. prestamo_saldos y el cierre automatico del prestamo cuando
-- el saldo llega a 0 ya funcionan (migracion anterior) y no se tocan aqui.

alter table public.pagos drop constraint pagos_tipo_check;
alter table public.pagos add constraint pagos_tipo_check
  check (tipo = any (array['cuota','parcial','vencida','mora','liquidacion','abono']));

create or replace function public.register_payment(
  p_organization_id uuid,
  p_prestamo_id uuid,
  p_cronograma_pago_id uuid,
  p_cliente_id uuid,
  p_cobrador_id uuid,
  p_registrado_por uuid,
  p_monto numeric,
  p_medio_pago public.medio_pago,
  p_tipo text,
  p_lat numeric default null,
  p_lng numeric default null,
  p_nota text default null
)
returns uuid
language plpgsql
set search_path = 'public'
as $$
declare
  v_pago_id uuid;
  v_saldo_nuevo numeric;
  v_remaining numeric;
  v_apply numeric;
  v_cuota record;
begin
  if not exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and organization_id = p_organization_id
      and rol in ('admin', 'cobrador')
      and activo = true
  ) then
    raise exception 'Unauthorized';
  end if;

  insert into public.pagos (
    organization_id,
    prestamo_id,
    cronograma_pago_id,
    cliente_id,
    cobrador_id,
    registrado_por,
    monto,
    medio_pago,
    tipo,
    lat,
    lng,
    nota,
    created_at
  ) values (
    p_organization_id,
    p_prestamo_id,
    p_cronograma_pago_id,
    p_cliente_id,
    p_cobrador_id,
    p_registrado_por,
    p_monto,
    p_medio_pago,
    p_tipo,
    p_lat,
    p_lng,
    p_nota,
    now()
  ) returning id into v_pago_id;

  if exists (select 1 from public.prestamo_saldos where prestamo_id = p_prestamo_id) then
    update public.prestamo_saldos
    set total_pagado = total_pagado + p_monto,
        saldo_pendiente = saldo_pendiente - p_monto,
        updated_at = now()
    where prestamo_id = p_prestamo_id
    returning saldo_pendiente into v_saldo_nuevo;
  end if;

  if p_cronograma_pago_id is not null then
    update public.cronograma_pagos
    set monto_pagado = monto_pagado + p_monto,
        fecha_pago = coalesce(fecha_pago, now()),
        medio_pago = p_medio_pago,
        estado = case
          when monto_pagado + p_monto >= monto_esperado then 'pagado'
          else 'parcial'
        end
    where id = p_cronograma_pago_id;
  elsif p_tipo = 'abono' then
    v_remaining := p_monto;

    for v_cuota in
      select id, monto_esperado, monto_pagado
      from public.cronograma_pagos
      where prestamo_id = p_prestamo_id
        and estado in ('pendiente', 'parcial')
      order by numero_cuota asc
    loop
      exit when v_remaining <= 0;

      v_apply := least(v_remaining, v_cuota.monto_esperado - v_cuota.monto_pagado);

      update public.cronograma_pagos
      set monto_pagado = monto_pagado + v_apply,
          fecha_pago = coalesce(fecha_pago, now()),
          medio_pago = p_medio_pago,
          estado = case
            when monto_pagado + v_apply >= monto_esperado then 'pagado'
            else 'parcial'
          end
      where id = v_cuota.id;

      v_remaining := v_remaining - v_apply;
    end loop;
  end if;

  if v_saldo_nuevo is not null and v_saldo_nuevo <= 0 then
    update public.prestamos
    set estado = 'saldado'
    where id = p_prestamo_id
      and estado in ('activo', 'en_mora');
  end if;

  perform public.audit_action(
    p_organization_id => p_organization_id,
    p_actor_id => p_registrado_por,
    p_actor_rol => (select rol::text from public.profiles where id = p_registrado_por),
    p_accion => 'pago_registrado',
    p_entidad => 'pagos',
    p_entidad_id => v_pago_id,
    p_estado_nuevo => jsonb_build_object(
      'monto', p_monto,
      'tipo', p_tipo,
      'prestamo_id', p_prestamo_id,
      'saldo_nuevo', v_saldo_nuevo
    )
  );

  return v_pago_id;
end;
$$;

notify pgrst, 'reload schema';
