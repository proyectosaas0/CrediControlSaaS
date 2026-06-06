grant usage on schema private to anon;
grant execute on function private.current_org_id() to anon;
grant execute on function private.current_rol() to anon;
grant execute on function private.is_super_admin() to anon;

notify pgrst, 'reload schema';
