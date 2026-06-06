-- Remove legacy public audit log read policy.

drop policy if exists audit_logs_select_admin on public.audit_logs;
