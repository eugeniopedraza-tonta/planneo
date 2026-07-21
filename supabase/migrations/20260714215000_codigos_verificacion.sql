-- Verificación de email por código de 6 dígitos en el registro de cuentas
-- (clientes y proveedores). Los códigos se guardan hasheados, expiran a los
-- 10 minutos y tienen límite de intentos.
-- Solo el service role accede a la tabla: RLS activo sin policies ni grants.

create table email_verification_codes (
  email text primary key,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table email_verification_codes enable row level security;

-- ¿Existe ya una cuenta con este email? Permite avisar al usuario antes de
-- enviarle un código. Solo ejecutable por el service role.
create function public.email_has_account(check_email text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users where lower(email) = lower(check_email)
  );
$$;

revoke execute on function public.email_has_account(text) from public, anon, authenticated;
grant execute on function public.email_has_account(text) to service_role;
