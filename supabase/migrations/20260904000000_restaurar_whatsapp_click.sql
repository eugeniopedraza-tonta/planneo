-- El MVP vuelve a medir clics de WhatsApp. Se reabre whatsapp_click
-- y se conserva contact_click para no romper filas históricas.
alter table leads drop constraint leads_type_check;
alter table leads add constraint leads_type_check
  check (type in ('contact_click', 'profile_view', 'whatsapp_click'));
