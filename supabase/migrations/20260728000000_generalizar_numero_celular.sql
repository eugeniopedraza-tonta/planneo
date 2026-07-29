-- Generaliza el contacto telefónico: no todos los proveedores usan WhatsApp
-- específicamente, así que se renombra a un campo genérico de celular.
alter table providers rename column whatsapp to phone;

alter table leads drop constraint leads_type_check;
update leads set type = 'contact_click' where type = 'whatsapp_click';
alter table leads add constraint leads_type_check check (type in ('contact_click', 'profile_view'));
