-- La verificación de email y la recuperación de contraseña ahora las maneja
-- Supabase Auth de forma nativa (signUp + verifyOtp / resetPasswordForEmail),
-- así que la infraestructura del OTP casero ya no se necesita.

drop table if exists email_verification_codes;
drop function if exists public.email_has_account(text);
drop function if exists public.user_id_for_email(text);
