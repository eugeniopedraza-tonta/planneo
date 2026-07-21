-- Recuperación de contraseña: resolver el id del usuario a partir de su email
-- para poder actualizar la contraseña tras verificar el código de 6 dígitos.
-- Solo ejecutable por el service role.

create function public.user_id_for_email(check_email text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(check_email) limit 1;
$$;

revoke execute on function public.user_id_for_email(text) from public, anon, authenticated;
grant execute on function public.user_id_for_email(text) to service_role;
