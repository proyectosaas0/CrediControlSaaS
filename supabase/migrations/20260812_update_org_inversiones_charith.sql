-- Rename Dairon Ramirez's organization and update its contact phone.
update public.organizations
set nombre_negocio = 'Inversiones Charith',
    telefono = '3115259753'
where id = '2bb9e9d4-59bb-48f4-9318-d92653d12ce5';
